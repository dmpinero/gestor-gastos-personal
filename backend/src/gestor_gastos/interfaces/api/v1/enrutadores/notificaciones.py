from dataclasses import asdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.notificaciones.listar_proximos_eventos import (
    ListarProximosEventos,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_asociaciones_descripcion_sqlalchemy import (  # noqa: E501
    RepositorioAsociacionesDescripcionSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_asociaciones_sqlalchemy import (  # noqa: E501
    RepositorioAsociacionesSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)
from gestor_gastos.interfaces.api.dependencias import obtener_sesion
from gestor_gastos.interfaces.api.v1.esquemas.notificaciones import ProximoEventoEsquema

enrutador = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@enrutador.get("", response_model=list[ProximoEventoEsquema])
def listar(sesion: Session = Depends(obtener_sesion)) -> list[ProximoEventoEsquema]:
    eventos = ListarProximosEventos(
        RepositorioMovimientosSqlAlchemy(sesion),
        RepositorioPrevisionesSqlAlchemy(sesion),
        RepositorioAsociacionesSqlAlchemy(sesion),
        RepositorioAsociacionesDescripcionSqlAlchemy(sesion),
    ).ejecutar()
    return [ProximoEventoEsquema(**asdict(evento)) for evento in eventos]
