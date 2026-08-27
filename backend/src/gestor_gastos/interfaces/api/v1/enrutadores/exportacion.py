from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.categoria.listar_categorias import ListarCategorias
from gestor_gastos.aplicacion.cuenta.listar_cuentas import ListarCuentas
from gestor_gastos.aplicacion.exportacion.exportar_datos_completos import ExportarDatosCompletos
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
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_ajustes_prevision_sqlalchemy import (  # noqa: E501
    RepositorioAjustesPrevisionSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_cuentas_sqlalchemy import (  # noqa: E501
    RepositorioCuentasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)
from gestor_gastos.interfaces.api.dependencias import obtener_sesion

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
