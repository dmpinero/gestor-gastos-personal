import datetime
from decimal import Decimal

from gestor_gastos.dominio.categoria.entidades import Categoria
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_cuentas_sqlalchemy import (
    RepositorioCuentasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)


def _preparar_cuenta_y_categoria(sesion_bd):
    cuenta = RepositorioCuentasSqlAlchemy(sesion_bd).crear(CuentaBancaria(numero_cuenta="ES00"))
    categoria = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_categoria(
        Categoria(nombre="Alimentación")
    )
    return cuenta, categoria


def test_crear_y_listar_por_cuenta_ordenado(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Antiguo",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 15),
            descripcion="Reciente",
            importe=Decimal("-5.00"),
            saldo=Decimal("95.00"),
        )
    )

    movimientos = repositorio.listar_por_cuenta(cuenta.id)

    assert [m.descripcion for m in movimientos] == ["Reciente", "Antiguo"]


def test_existe_duplicado(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Compra",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )

    assert (
        repositorio.existe_duplicado(
            cuenta.id, datetime.date(2026, 1, 1), Decimal("-10.00"), Decimal("100.00"), "Compra"
        )
        is True
    )
    assert (
        repositorio.existe_duplicado(
            cuenta.id, datetime.date(2026, 1, 2), Decimal("-10.00"), Decimal("100.00"), "Compra"
        )
        is False
    )


def test_existen_movimientos_de_cuenta_categoria_y_subcategoria(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)

    assert repositorio.existen_movimientos_de_cuenta(cuenta.id) is False

    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Compra",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )

    assert repositorio.existen_movimientos_de_cuenta(cuenta.id) is True
    assert repositorio.existen_movimientos_de_categoria(categoria.id) is True
    assert repositorio.existen_movimientos_de_subcategoria(999) is False
