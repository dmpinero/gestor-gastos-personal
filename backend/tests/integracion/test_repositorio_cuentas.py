from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_cuentas_sqlalchemy import (
    RepositorioCuentasSqlAlchemy,
)


def test_crear_y_obtener_por_numero_de_cuenta(sesion_bd) -> None:
    repositorio = RepositorioCuentasSqlAlchemy(sesion_bd)

    repositorio.crear(CuentaBancaria(numero_cuenta="ES00 1234", alias="Nómina"))

    encontrada = repositorio.obtener_por_numero_cuenta("ES00 1234")
    assert encontrada is not None
    assert encontrada.alias == "Nómina"


def test_obtener_por_numero_de_cuenta_inexistente_devuelve_none(sesion_bd) -> None:
    repositorio = RepositorioCuentasSqlAlchemy(sesion_bd)

    assert repositorio.obtener_por_numero_cuenta("NO-EXISTE") is None


def test_listar_devuelve_todas_las_cuentas(sesion_bd) -> None:
    repositorio = RepositorioCuentasSqlAlchemy(sesion_bd)
    repositorio.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    repositorio.crear(CuentaBancaria(numero_cuenta="ES00 5678"))

    assert len(repositorio.listar()) == 2


def test_actualizar_persiste_los_cambios(sesion_bd) -> None:
    repositorio = RepositorioCuentasSqlAlchemy(sesion_bd)
    cuenta = repositorio.crear(CuentaBancaria(numero_cuenta="ES00 1234"))

    cuenta.alias = "Cuenta nómina"
    repositorio.actualizar(cuenta)

    assert repositorio.obtener_por_id(cuenta.id).alias == "Cuenta nómina"


def test_eliminar_borra_la_cuenta(sesion_bd) -> None:
    repositorio = RepositorioCuentasSqlAlchemy(sesion_bd)
    cuenta = repositorio.crear(CuentaBancaria(numero_cuenta="ES00 1234"))

    repositorio.eliminar(cuenta.id)

    assert repositorio.obtener_por_id(cuenta.id) is None
