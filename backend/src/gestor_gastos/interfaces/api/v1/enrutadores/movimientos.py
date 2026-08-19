from dataclasses import asdict

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.movimiento.actualizar_movimiento import ActualizarMovimiento
from gestor_gastos.aplicacion.movimiento.crear_movimiento import CrearMovimiento
from gestor_gastos.aplicacion.movimiento.eliminar_movimiento import EliminarMovimiento
from gestor_gastos.aplicacion.movimiento.listar_movimientos import ListarMovimientos
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
from gestor_gastos.interfaces.api.respuestas_error import (
    RESPUESTA_CUERPO_MALFORMADO,
    RESPUESTA_FILTRO_INVALIDO,
    RESPUESTA_NO_ENCONTRADO,
)
from gestor_gastos.interfaces.api.v1.esquemas.movimiento import (
    MovimientoActualizarEsquema,
    MovimientoCrearEsquema,
    MovimientoSalidaEsquema,
)

enrutador = APIRouter(prefix="/movimientos", tags=["Movimientos"])


@enrutador.get(
    "", response_model=list[MovimientoSalidaEsquema], responses=RESPUESTA_FILTRO_INVALIDO
)
def listar(
    cuenta_id: int | None = Query(None),
    categoria_id: int | None = Query(None),
    subcategoria_id: int | None = Query(None),
    solo_gastos: bool = Query(False),
    sesion: Session = Depends(obtener_sesion),
) -> list[MovimientoSalidaEsquema]:
    movimientos = ListarMovimientos(RepositorioMovimientosSqlAlchemy(sesion)).ejecutar(
        cuenta_id=cuenta_id,
        categoria_id=categoria_id,
        subcategoria_id=subcategoria_id,
        solo_gastos=solo_gastos,
    )
    return [MovimientoSalidaEsquema(**asdict(m)) for m in movimientos]


@enrutador.post(
    "",
    response_model=MovimientoSalidaEsquema,
    status_code=status.HTTP_201_CREATED,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CUERPO_MALFORMADO},
)
def crear(
    datos: MovimientoCrearEsquema, sesion: Session = Depends(obtener_sesion)
) -> MovimientoSalidaEsquema:
    movimiento = CrearMovimiento(
        RepositorioMovimientosSqlAlchemy(sesion),
        RepositorioCuentasSqlAlchemy(sesion),
        RepositorioCategoriasSqlAlchemy(sesion),
    ).ejecutar(**datos.model_dump())
    return MovimientoSalidaEsquema(**asdict(movimiento))


@enrutador.put(
    "/{id_movimiento:int}",
    response_model=MovimientoSalidaEsquema,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CUERPO_MALFORMADO},
)
def actualizar(
    id_movimiento: int,
    datos: MovimientoActualizarEsquema,
    sesion: Session = Depends(obtener_sesion),
) -> MovimientoSalidaEsquema:
    movimiento = ActualizarMovimiento(
        RepositorioMovimientosSqlAlchemy(sesion),
        RepositorioCuentasSqlAlchemy(sesion),
        RepositorioCategoriasSqlAlchemy(sesion),
    ).ejecutar(id_movimiento, **datos.model_dump())
    return MovimientoSalidaEsquema(**asdict(movimiento))


@enrutador.delete(
    "/{id_movimiento:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=RESPUESTA_NO_ENCONTRADO,
)
def eliminar(id_movimiento: int, sesion: Session = Depends(obtener_sesion)) -> None:
    EliminarMovimiento(RepositorioMovimientosSqlAlchemy(sesion)).ejecutar(id_movimiento)
