from dataclasses import asdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.dashboard.obtener_resumen import ObtenerResumenDashboard
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
from gestor_gastos.interfaces.api.v1.esquemas.dashboard import ResumenDashboardEsquema

enrutador = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@enrutador.get("/resumen", response_model=ResumenDashboardEsquema)
def obtener_resumen(sesion: Session = Depends(obtener_sesion)) -> ResumenDashboardEsquema:
    resumen = ObtenerResumenDashboard(
        RepositorioCuentasSqlAlchemy(sesion),
        RepositorioCategoriasSqlAlchemy(sesion),
        RepositorioMovimientosSqlAlchemy(sesion),
    ).ejecutar()
    return ResumenDashboardEsquema(**asdict(resumen))
