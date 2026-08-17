from dataclasses import asdict

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.cuenta.actualizar_cuenta import ActualizarCuenta
from gestor_gastos.aplicacion.cuenta.crear_cuenta import CrearCuenta
from gestor_gastos.aplicacion.cuenta.eliminar_cuenta import EliminarCuenta
from gestor_gastos.aplicacion.cuenta.listar_cuentas import ListarCuentas
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_cuentas_sqlalchemy import (
    RepositorioCuentasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.interfaces.api.dependencias import obtener_sesion
from gestor_gastos.interfaces.api.respuestas_error import (
    RESPUESTA_CONFLICTO,
    RESPUESTA_CUERPO_MALFORMADO,
    RESPUESTA_NO_ENCONTRADO,
)
from gestor_gastos.interfaces.api.v1.esquemas.cuenta import (
    CuentaActualizarEsquema,
    CuentaCrearEsquema,
    CuentaSalidaEsquema,
)

enrutador = APIRouter(prefix="/cuentas", tags=["Cuentas"])


def _a_esquema(cuenta: CuentaBancaria) -> CuentaSalidaEsquema:
    return CuentaSalidaEsquema(**asdict(cuenta))


@enrutador.get("", response_model=list[CuentaSalidaEsquema])
def listar(sesion: Session = Depends(obtener_sesion)) -> list[CuentaSalidaEsquema]:
    cuentas = ListarCuentas(RepositorioCuentasSqlAlchemy(sesion)).ejecutar()
    return [_a_esquema(c) for c in cuentas]


@enrutador.post(
    "",
    response_model=CuentaSalidaEsquema,
    status_code=status.HTTP_201_CREATED,
    responses={**RESPUESTA_CONFLICTO, **RESPUESTA_CUERPO_MALFORMADO},
)
def crear(
    datos: CuentaCrearEsquema, sesion: Session = Depends(obtener_sesion)
) -> CuentaSalidaEsquema:
    cuenta = CrearCuenta(RepositorioCuentasSqlAlchemy(sesion)).ejecutar(**datos.model_dump())
    return _a_esquema(cuenta)


@enrutador.put(
    "/{id_cuenta:int}",
    response_model=CuentaSalidaEsquema,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CUERPO_MALFORMADO},
)
def actualizar(
    id_cuenta: int, datos: CuentaActualizarEsquema, sesion: Session = Depends(obtener_sesion)
) -> CuentaSalidaEsquema:
    cuenta = ActualizarCuenta(RepositorioCuentasSqlAlchemy(sesion)).ejecutar(
        id_cuenta, **datos.model_dump()
    )
    return _a_esquema(cuenta)


@enrutador.delete(
    "/{id_cuenta:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CONFLICTO},
)
def eliminar(id_cuenta: int, sesion: Session = Depends(obtener_sesion)) -> None:
    EliminarCuenta(
        RepositorioCuentasSqlAlchemy(sesion), RepositorioMovimientosSqlAlchemy(sesion)
    ).ejecutar(id_cuenta)
