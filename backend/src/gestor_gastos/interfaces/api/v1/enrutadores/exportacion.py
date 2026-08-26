from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.categoria.listar_categorias import ListarCategorias
from gestor_gastos.aplicacion.cuenta.listar_cuentas import ListarCuentas
from gestor_gastos.aplicacion.exportacion.exportar_datos_completos import ExportarDatosCompletos
from gestor_gastos.aplicacion.exportacion.importar_datos_completos import ImportarDatosCompletos
from gestor_gastos.aplicacion.movimiento.listar_todos_los_movimientos import (
    ListarTodosLosMovimientos,
)
from gestor_gastos.aplicacion.prevision.listar_conceptos_previstos import (
    ListarConceptosPrevistos,
)
from gestor_gastos.aplicacion.prevision.listar_todos_los_ajustes import ListarTodosLosAjustes
from gestor_gastos.infraestructura.exportacion.escritor_exportacion_completa_openpyxl import (
    EscritorExportacionCompletaOpenpyxl,
)
from gestor_gastos.infraestructura.exportacion.lector_exportacion_completa_openpyxl import (
    LectorExportacionCompletaOpenpyxl,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_ajustes_prevision_sqlalchemy import (  # noqa: E501
    RepositorioAjustesPrevisionSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_cuentas_sqlalchemy import (  # noqa: E501
    RepositorioCuentasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_importacion_completa_sqlalchemy import (  # noqa: E501
    RepositorioImportacionCompletaSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)
from gestor_gastos.interfaces.api.dependencias import obtener_sesion
from gestor_gastos.interfaces.api.respuestas_error import RESPUESTA_CUERPO_MALFORMADO
from gestor_gastos.interfaces.api.v1.esquemas.exportacion import (
    ResumenImportacionDatosCompletosEsquema,
)

enrutador = APIRouter(prefix="/exportacion", tags=["Exportación"])


@enrutador.get(
    "/datos",
    responses={
        200: {
            "content": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}},
            "description": "Excel con todos los datos almacenados",
        }
    },
)
def exportar_datos(sesion: Session = Depends(obtener_sesion)) -> Response:
    contenido = ExportarDatosCompletos(
        ListarCuentas(RepositorioCuentasSqlAlchemy(sesion)),
        ListarCategorias(RepositorioCategoriasSqlAlchemy(sesion)),
        ListarTodosLosMovimientos(RepositorioMovimientosSqlAlchemy(sesion)),
        ListarConceptosPrevistos(RepositorioPrevisionesSqlAlchemy(sesion)),
        ListarTodosLosAjustes(RepositorioAjustesPrevisionSqlAlchemy(sesion)),
        EscritorExportacionCompletaOpenpyxl(),
    ).ejecutar()
    return Response(
        content=contenido,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="backup-gestor-gastos.xlsx"'},
    )


@enrutador.post(
    "/datos/importar",
    response_model=ResumenImportacionDatosCompletosEsquema,
    responses=RESPUESTA_CUERPO_MALFORMADO,
)
async def importar_datos(
    fichero: UploadFile, sesion: Session = Depends(obtener_sesion)
) -> ResumenImportacionDatosCompletosEsquema:
    contenido = await fichero.read()
    resumen = ImportarDatosCompletos(
        LectorExportacionCompletaOpenpyxl(),
        RepositorioImportacionCompletaSqlAlchemy(sesion),
    ).ejecutar(contenido, fichero.filename or "")
    return ResumenImportacionDatosCompletosEsquema(
        cuentas_importadas=resumen.cuentas_importadas,
        categorias_importadas=resumen.categorias_importadas,
        subcategorias_importadas=resumen.subcategorias_importadas,
        movimientos_importados=resumen.movimientos_importados,
        conceptos_previstos_importados=resumen.conceptos_previstos_importados,
        ajustes_importados=resumen.ajustes_importados,
    )
