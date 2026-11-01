from dataclasses import asdict
from pathlib import Path

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.adjunto.eliminar_adjuntos_de_movimiento import (
    EliminarAdjuntosDeMovimiento,
)
from gestor_gastos.aplicacion.movimiento.actualizar_movimiento import ActualizarMovimiento
from gestor_gastos.aplicacion.movimiento.crear_movimiento import CrearMovimiento
from gestor_gastos.aplicacion.movimiento.eliminar_movimiento import EliminarMovimiento
from gestor_gastos.aplicacion.movimiento.listar_movimientos import ListarMovimientos
from gestor_gastos.configuracion import obtener_configuracion
from gestor_gastos.dominio.excepciones import FiltroDeListadoInvalidoError
from gestor_gastos.infraestructura.almacenamiento.almacen_adjuntos_filesystem import (
    AlmacenAdjuntosFilesystem,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_adjuntos_sqlalchemy import (  # noqa: E501
    RepositorioAdjuntosSqlAlchemy,
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
    request: Request,
    cuenta_id: int | None = Query(None),
    categoria_id: int | None = Query(None),
    subcategoria_id: int | None = Query(None),
    solo_gastos: bool = Query(False),
    sesion: Session = Depends(obtener_sesion),
) -> list[MovimientoSalidaEsquema]:
    # FastAPI/Starlette no rechazan por sí solos un query param escalar
    # repetido (?cuenta_id=1&cuenta_id=2): toman un único valor en silencio,
    # violando la cardinalidad 1 declarada en el esquema OpenAPI (ver
    # tests/contrato/test_contrato_openapi.py). Se valida explícitamente
    # contra los parámetros crudos de la petición.
    for nombre in ("cuenta_id", "categoria_id", "subcategoria_id"):
        if len(request.query_params.getlist(nombre)) > 1:
            raise FiltroDeListadoInvalidoError(f"El filtro '{nombre}' no admite varios valores")
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
    almacen = AlmacenAdjuntosFilesystem(Path(obtener_configuracion().ruta_adjuntos))
    eliminar_adjuntos = EliminarAdjuntosDeMovimiento(RepositorioAdjuntosSqlAlchemy(sesion), almacen)
    EliminarMovimiento(RepositorioMovimientosSqlAlchemy(sesion), eliminar_adjuntos).ejecutar(
        id_movimiento
    )
