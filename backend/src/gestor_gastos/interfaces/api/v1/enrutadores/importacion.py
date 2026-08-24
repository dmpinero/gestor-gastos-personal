import json
from collections.abc import Iterator
from dataclasses import asdict

from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.importacion.importar_movimientos_excel import (
    ImportarMovimientosExcel,
)
from gestor_gastos.dominio.importacion.valores import EventoProgreso
from gestor_gastos.infraestructura.importacion.lector_excel_pandas import LectorExcelPandas
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
from gestor_gastos.interfaces.api.v1.esquemas.importacion import ResumenImportacionEsquema

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
