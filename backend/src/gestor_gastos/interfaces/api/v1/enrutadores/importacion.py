import json
from collections.abc import Iterator
from dataclasses import asdict

from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.importacion.analizar_importacion_excel import (
    AnalizarImportacionExcel,
)
from gestor_gastos.aplicacion.importacion.importar_movimientos_excel import (
    ImportarMovimientosExcel,
)
from gestor_gastos.aplicacion.importacion.importar_movimientos_pdf import ImportarMovimientosPdf
from gestor_gastos.dominio.importacion.valores import (
    CabeceraExcel,
    DatosExcelLeidos,
    EventoProgreso,
    FilaMovimientoExcel,
)
from gestor_gastos.infraestructura.importacion.lector_excel_pandas import LectorExcelPandas
from gestor_gastos.infraestructura.importacion.lector_pdf_ing import LectorPdfIng
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_asociaciones_descripcion_sqlalchemy import (  # noqa: E501
    RepositorioAsociacionesDescripcionSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_cuentas_sqlalchemy import (
    RepositorioCuentasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.interfaces.api.dependencias import obtener_sesion
from gestor_gastos.interfaces.api.respuestas_error import RESPUESTA_CUERPO_MALFORMADO
from gestor_gastos.interfaces.api.v1.esquemas.importacion import (
    AnalisisImportacionExcelEsquema,
    ResumenImportacionEsquema,
)

enrutador = APIRouter(prefix="/movimientos", tags=["Movimientos"])


@enrutador.post(
    "/importar",
    responses={
        200: {
            "description": (
                'Flujo NDJSON: una línea {"tipo": "progreso", ...} por cada fila '
                'procesada y, al final, una línea {"tipo": "resumen", ...} con el '
                "resumen completo de la importación."
            ),
            "content": {"application/x-ndjson": {}},
        },
        **RESPUESTA_CUERPO_MALFORMADO,
    },
)
async def importar(
    fichero: UploadFile, sesion: Session = Depends(obtener_sesion)
) -> StreamingResponse:
    contenido = await fichero.read()
    nombre_fichero = fichero.filename or ""
    caso_de_uso: ImportarMovimientosExcel | ImportarMovimientosPdf
    if nombre_fichero.lower().endswith(".pdf"):
        caso_de_uso = ImportarMovimientosPdf(
            RepositorioCuentasSqlAlchemy(sesion),
            RepositorioCategoriasSqlAlchemy(sesion),
            RepositorioMovimientosSqlAlchemy(sesion),
            RepositorioAsociacionesDescripcionSqlAlchemy(sesion),
            LectorPdfIng(),
        )
    else:
        caso_de_uso = ImportarMovimientosExcel(
            RepositorioCuentasSqlAlchemy(sesion),
            RepositorioCategoriasSqlAlchemy(sesion),
            RepositorioMovimientosSqlAlchemy(sesion),
            LectorExcelPandas(),
        )
    # Se parsea el fichero ANTES de empezar a streamear la respuesta: así, si
    # el fichero está mal formado, el error de validación se traduce en un
    # 422 normal (ver manejadores_errores.py) en vez de cortar a media
    # transmisión una respuesta que ya empezó con 200.
    datos = caso_de_uso.leer(contenido, fichero.filename or "")

    def generar_eventos() -> Iterator[str]:
        for evento in caso_de_uso.ejecutar(datos):
            if isinstance(evento, EventoProgreso):
                linea = {"tipo": "progreso", "procesadas": evento.procesadas, "total": evento.total}
            else:
                resumen_json = ResumenImportacionEsquema(**asdict(evento)).model_dump(mode="json")
                linea = {"tipo": "resumen", **resumen_json}
            yield json.dumps(linea) + "\n"

    return StreamingResponse(generar_eventos(), media_type="application/x-ndjson")


@enrutador.post(
    "/importar/analizar",
    response_model=AnalisisImportacionExcelEsquema,
    responses=RESPUESTA_CUERPO_MALFORMADO,
)
async def analizar(
    fichero: UploadFile, sesion: Session = Depends(obtener_sesion)
) -> AnalisisImportacionExcelEsquema:
    """Solo lectura: parsea el Excel y propone categoría/subcategoría por
    fila (ver AnalizarImportacionExcel), sin crear nada en la base de
    datos. El resultado se revisa/edita en el frontend y se envía a
    /importar/confirmar para persistirlo."""
    contenido = await fichero.read()
    caso_de_uso = ImportarMovimientosExcel(
        RepositorioCuentasSqlAlchemy(sesion),
        RepositorioCategoriasSqlAlchemy(sesion),
        RepositorioMovimientosSqlAlchemy(sesion),
        LectorExcelPandas(),
    )
    datos = caso_de_uso.leer(contenido, fichero.filename or "")
    analisis = AnalizarImportacionExcel(
        RepositorioCategoriasSqlAlchemy(sesion),
        RepositorioAsociacionesDescripcionSqlAlchemy(sesion),
    ).ejecutar(datos)
    return AnalisisImportacionExcelEsquema(**asdict(analisis))


@enrutador.post(
    "/importar/confirmar",
    response_model=ResumenImportacionEsquema,
    responses=RESPUESTA_CUERPO_MALFORMADO,
)
def confirmar(
    datos: AnalisisImportacionExcelEsquema, sesion: Session = Depends(obtener_sesion)
) -> ResumenImportacionEsquema:
    """Persiste las filas ya revisadas (categoría/subcategoría ya
    decididas): reconstruye el mismo DatosExcelLeidos que produciría
    ImportarMovimientosExcel.leer y reutiliza su .ejecutar tal cual (misma
    detección de duplicados y creación de categorías/subcategorías por
    nombre que la importación directa). Sin streaming de progreso: el
    análisis ya hizo el trabajo pesado, aquí solo quedan altas en BD."""
    datos_excel = DatosExcelLeidos(
        cabecera=CabeceraExcel(**datos.cabecera.model_dump()),
        filas=[
            FilaMovimientoExcel(
                fecha_valor=fila.fecha_valor,
                categoria=fila.categoria,
                subcategoria=fila.subcategoria,
                descripcion=fila.descripcion,
                comentario=fila.comentario,
                importe=fila.importe,
                saldo=fila.saldo,
            )
            for fila in datos.filas
        ],
    )
    caso_de_uso = ImportarMovimientosExcel(
        RepositorioCuentasSqlAlchemy(sesion),
        RepositorioCategoriasSqlAlchemy(sesion),
        RepositorioMovimientosSqlAlchemy(sesion),
        LectorExcelPandas(),
    )
    # ejecutar() es un generador que siempre termina con un ResumenImportacion
    # (ver su docstring); se consume entero aquí en vez de streamearlo.
    eventos = list(caso_de_uso.ejecutar(datos_excel))
    resumen = eventos[-1]
    return ResumenImportacionEsquema(**asdict(resumen))
