import datetime
from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.categoria.crear_subcategoria import CrearSubcategoria
from gestor_gastos.aplicacion.cuenta.crear_cuenta import CrearCuenta
from gestor_gastos.aplicacion.movimiento.actualizar_movimiento import ActualizarMovimiento
from gestor_gastos.aplicacion.movimiento.crear_movimiento import CrearMovimiento
from gestor_gastos.aplicacion.movimiento.eliminar_movimiento import EliminarMovimiento
from gestor_gastos.aplicacion.movimiento.listar_movimientos import ListarMovimientos
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError, FiltroDeListadoInvalidoError
from tests.unitarios.aplicacion.dobles import (
    RepositorioCategoriasFalso,
    RepositorioCuentasFalso,
    RepositorioMovimientosFalso,
)


def _preparar():
    repo_movimientos = RepositorioMovimientosFalso()
    repo_cuentas = RepositorioCuentasFalso()
    repo_categorias = RepositorioCategoriasFalso()
    cuenta = CrearCuenta(repo_cuentas).ejecutar(numero_cuenta="ES00 1234")
    categoria = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    return repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria


def _crear(
    repo_movimientos,
    repo_cuentas,
    repo_categorias,
    cuenta,
    categoria,
    fecha,
    importe="-10.00",
    saldo="100.00",
    descripcion="Compra",
):
    return CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=categoria.id,
        fecha_valor=fecha,
        descripcion=descripcion,
        importe=Decimal(importe),
        saldo=Decimal(saldo),
    )


def test_crear_movimiento_de_cargo() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()

    movimiento = _crear(
        repo_movimientos,
        repo_cuentas,
        repo_categorias,
        cuenta,
        categoria,
        datetime.date(2026, 1, 1),
    )

    assert movimiento.id is not None
    assert movimiento.importe == Decimal("-10.00")


def test_crear_movimiento_de_abono_no_tiene_restriccion_de_signo() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()

    movimiento = _crear(
        repo_movimientos,
        repo_cuentas,
        repo_categorias,
        cuenta,
        categoria,
        datetime.date(2026, 1, 1),
        importe="500.00",
    )

    assert movimiento.importe == Decimal("500.00")


def test_crear_movimiento_con_cuenta_inexistente_falla() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, _, categoria = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
            cuenta_id=999,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Compra",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )


def test_crear_movimiento_con_categoria_inexistente_falla() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
            cuenta_id=cuenta.id,
            categoria_id=999,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Compra",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )


def test_crear_movimiento_con_subcategoria_inexistente_falla() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            subcategoria_id=999,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Compra",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )


def test_actualizar_movimiento_cambia_categoria() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()
    movimiento = _crear(
        repo_movimientos,
        repo_cuentas,
        repo_categorias,
        cuenta,
        categoria,
        datetime.date(2026, 1, 1),
    )
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Ocio y viajes")

    actualizado = ActualizarMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        movimiento.id,
        cuenta_id=movimiento.cuenta_id,
        categoria_id=otra_categoria.id,
        fecha_valor=movimiento.fecha_valor,
        descripcion=movimiento.descripcion,
        importe=movimiento.importe,
        saldo=movimiento.saldo,
    )

    assert actualizado.categoria_id == otra_categoria.id


def test_actualizar_movimiento_inexistente_falla() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        ActualizarMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
            999,
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="x",
            importe=Decimal("-1"),
            saldo=Decimal("1"),
        )


def test_eliminar_movimiento_lo_borra() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()
    movimiento = _crear(
        repo_movimientos,
        repo_cuentas,
        repo_categorias,
        cuenta,
        categoria,
        datetime.date(2026, 1, 1),
    )

    EliminarMovimiento(repo_movimientos).ejecutar(movimiento.id)

    assert repo_movimientos.obtener_por_id(movimiento.id) is None


def test_listar_movimientos_ordenados_de_mas_reciente_a_mas_antiguo() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()
    _crear(
        repo_movimientos,
        repo_cuentas,
        repo_categorias,
        cuenta,
        categoria,
        datetime.date(2026, 1, 1),
        descripcion="Antiguo",
    )
    _crear(
        repo_movimientos,
        repo_cuentas,
        repo_categorias,
        cuenta,
        categoria,
        datetime.date(2026, 1, 15),
        descripcion="Reciente",
    )

    movimientos = ListarMovimientos(repo_movimientos).ejecutar(cuenta_id=cuenta.id)

    assert [m.descripcion for m in movimientos] == ["Reciente", "Antiguo"]


def test_listar_movimientos_sin_ningun_filtro_falla() -> None:
    repo_movimientos, _, _, _, _ = _preparar()

    with pytest.raises(FiltroDeListadoInvalidoError):
        ListarMovimientos(repo_movimientos).ejecutar()


def test_listar_movimientos_con_varios_filtros_a_la_vez_falla() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()

    with pytest.raises(FiltroDeListadoInvalidoError):
        ListarMovimientos(repo_movimientos).ejecutar(cuenta_id=cuenta.id, categoria_id=categoria.id)


def test_listar_movimientos_por_categoria_cruza_cuentas_y_excluye_ingresos() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()
    otra_cuenta = CrearCuenta(repo_cuentas).ejecutar(numero_cuenta="ES00 5678")
    _crear(
        repo_movimientos,
        repo_cuentas,
        repo_categorias,
        cuenta,
        categoria,
        datetime.date(2026, 1, 1),
        descripcion="Gasto cuenta 1",
    )
    _crear(
        repo_movimientos,
        repo_cuentas,
        repo_categorias,
        otra_cuenta,
        categoria,
        datetime.date(2026, 1, 2),
        descripcion="Gasto cuenta 2",
    )
    _crear(
        repo_movimientos,
        repo_cuentas,
        repo_categorias,
        cuenta,
        categoria,
        datetime.date(2026, 1, 3),
        importe="500.00",
        descripcion="Ingreso",
    )

    movimientos = ListarMovimientos(repo_movimientos).ejecutar(
        categoria_id=categoria.id, solo_gastos=True
    )

    assert [m.descripcion for m in movimientos] == ["Gasto cuenta 2", "Gasto cuenta 1"]


def test_listar_movimientos_por_subcategoria() -> None:
    repo_movimientos, repo_cuentas, repo_categorias, cuenta, categoria = _preparar()
    subcategoria = CrearSubcategoria(repo_categorias).ejecutar(categoria.id, "Supermercado")
    movimiento = CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=categoria.id,
        subcategoria_id=subcategoria.id,
        fecha_valor=datetime.date(2026, 1, 1),
        descripcion="Compra súper",
        importe=Decimal("-10.00"),
        saldo=Decimal("100.00"),
    )

    movimientos = ListarMovimientos(repo_movimientos).ejecutar(subcategoria_id=subcategoria.id)

    assert [m.id for m in movimientos] == [movimiento.id]
