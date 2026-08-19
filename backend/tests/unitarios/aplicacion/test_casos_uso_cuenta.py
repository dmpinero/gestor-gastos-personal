import datetime
from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.cuenta.actualizar_cuenta import ActualizarCuenta
from gestor_gastos.aplicacion.cuenta.crear_cuenta import CrearCuenta
from gestor_gastos.aplicacion.cuenta.eliminar_cuenta import EliminarCuenta
from gestor_gastos.aplicacion.cuenta.listar_cuentas import ListarCuentas
from gestor_gastos.aplicacion.cuenta.obtener_dependencias_cuenta import ObtenerDependenciasCuenta
from gestor_gastos.dominio.excepciones import (
    EntidadConDependenciasError,
    EntidadNoEncontradaError,
    NombreDuplicadoError,
)
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from tests.unitarios.aplicacion.dobles import RepositorioCuentasFalso, RepositorioMovimientosFalso


def test_crear_cuenta_la_guarda_y_le_asigna_id() -> None:
    repo = RepositorioCuentasFalso()

    cuenta = CrearCuenta(repo).ejecutar(numero_cuenta="ES00 1234", alias="Cuenta nómina")

    assert cuenta.id is not None
    assert repo.obtener_por_numero_cuenta("ES00 1234") == cuenta


def test_crear_cuenta_con_numero_ya_existente_falla() -> None:
    repo = RepositorioCuentasFalso()
    CrearCuenta(repo).ejecutar(numero_cuenta="ES00 1234")

    with pytest.raises(NombreDuplicadoError):
        CrearCuenta(repo).ejecutar(numero_cuenta="ES00 1234")


def test_listar_cuentas_vacio_devuelve_lista_vacia() -> None:
    repo = RepositorioCuentasFalso()

    assert ListarCuentas(repo).ejecutar() == []


def test_actualizar_cuenta_cambia_el_alias() -> None:
    repo = RepositorioCuentasFalso()
    cuenta = CrearCuenta(repo).ejecutar(numero_cuenta="ES00 1234")

    actualizada = ActualizarCuenta(repo).ejecutar(cuenta.id, alias="Cuenta nómina")

    assert actualizada.alias == "Cuenta nómina"


def test_eliminar_cuenta_sin_movimientos_la_borra() -> None:
    repo_cuentas = RepositorioCuentasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    cuenta = CrearCuenta(repo_cuentas).ejecutar(numero_cuenta="ES00 1234")

    EliminarCuenta(repo_cuentas, repo_movimientos).ejecutar(cuenta.id)

    assert repo_cuentas.obtener_por_id(cuenta.id) is None


def test_eliminar_cuenta_con_movimientos_falla() -> None:
    repo_cuentas = RepositorioCuentasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    cuenta = CrearCuenta(repo_cuentas).ejecutar(numero_cuenta="ES00 1234")
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=1,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Movimiento de prueba",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )

    with pytest.raises(EntidadConDependenciasError):
        EliminarCuenta(repo_cuentas, repo_movimientos).ejecutar(cuenta.id)


def test_eliminar_cuenta_con_movimientos_y_cascada_borra_todo() -> None:
    repo_cuentas = RepositorioCuentasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    cuenta = CrearCuenta(repo_cuentas).ejecutar(numero_cuenta="ES00 1234")
    movimiento = repo_movimientos.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=1,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Movimiento de prueba",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )

    EliminarCuenta(repo_cuentas, repo_movimientos).ejecutar(cuenta.id, cascada=True)

    assert repo_cuentas.obtener_por_id(cuenta.id) is None
    assert repo_movimientos.obtener_por_id(movimiento.id) is None


def test_obtener_dependencias_de_cuenta_inexistente_falla() -> None:
    repo_cuentas = RepositorioCuentasFalso()
    repo_movimientos = RepositorioMovimientosFalso()

    with pytest.raises(EntidadNoEncontradaError):
        ObtenerDependenciasCuenta(repo_cuentas, repo_movimientos).ejecutar(999)


def test_obtener_dependencias_de_cuenta_cuenta_sus_movimientos() -> None:
    repo_cuentas = RepositorioCuentasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    cuenta = CrearCuenta(repo_cuentas).ejecutar(numero_cuenta="ES00 1234")
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=1,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Uno",
            importe=Decimal("-10.00"),
            saldo=Decimal("90.00"),
        )
    )
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=1,
            fecha_valor=datetime.date(2026, 1, 2),
            descripcion="Dos",
            importe=Decimal("-5.00"),
            saldo=Decimal("85.00"),
        )
    )

    dependencias = ObtenerDependenciasCuenta(repo_cuentas, repo_movimientos).ejecutar(cuenta.id)

    assert dependencias.movimientos == 2
