import datetime
from decimal import Decimal

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.cuenta.crear_cuenta import CrearCuenta
from gestor_gastos.aplicacion.dashboard.obtener_resumen import ObtenerResumenDashboard
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from tests.unitarios.aplicacion.dobles import (
    RepositorioCategoriasFalso,
    RepositorioCuentasFalso,
    RepositorioMovimientosFalso,
)


def test_sin_cuentas_ni_movimientos_el_resumen_esta_vacio() -> None:
    resumen = ObtenerResumenDashboard(
        RepositorioCuentasFalso(), RepositorioCategoriasFalso(), RepositorioMovimientosFalso()
    ).ejecutar()

    assert resumen.saldo_global == Decimal("0")
    assert resumen.saldos_por_cuenta == []
    assert resumen.gastos_por_categoria == []
    assert resumen.ingresos_por_categoria == []


def test_una_cuenta_sin_movimientos_tiene_saldo_cero() -> None:
    repo_cuentas = RepositorioCuentasFalso()
    CrearCuenta(repo_cuentas).ejecutar("ES00 1111")

    resumen = ObtenerResumenDashboard(
        repo_cuentas, RepositorioCategoriasFalso(), RepositorioMovimientosFalso()
    ).ejecutar()

    assert len(resumen.saldos_por_cuenta) == 1
    assert resumen.saldos_por_cuenta[0].saldo == Decimal("0")
    assert resumen.saldo_global == Decimal("0")


def test_el_saldo_global_suma_el_ultimo_saldo_de_cada_cuenta() -> None:
    repo_cuentas = RepositorioCuentasFalso()
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    nomina = CrearCuenta(repo_cuentas).ejecutar("ES00 NOMINA")
    ahorro = CrearCuenta(repo_cuentas).ejecutar("ES00 AHORRO")
    categoria = CrearCategoria(repo_categorias).ejecutar("Nómina")
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=nomina.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Nómina enero",
            importe=Decimal("1500.00"),
            saldo=Decimal("1500.00"),
        )
    )
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=nomina.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 15),
            descripcion="Nómina extra",
            importe=Decimal("200.00"),
            saldo=Decimal("1700.00"),
        )
    )
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=ahorro.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Traspaso",
            importe=Decimal("500.00"),
            saldo=Decimal("500.00"),
        )
    )

    resumen = ObtenerResumenDashboard(repo_cuentas, repo_categorias, repo_movimientos).ejecutar()

    saldos = {s.cuenta_id: s.saldo for s in resumen.saldos_por_cuenta}
    assert saldos[nomina.id] == Decimal("1700.00")
    assert saldos[ahorro.id] == Decimal("500.00")
    assert resumen.saldo_global == Decimal("2200.00")


def test_gastos_e_ingresos_se_acumulan_por_categoria_en_todas_las_cuentas() -> None:
    repo_cuentas = RepositorioCuentasFalso()
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    cuenta_1 = CrearCuenta(repo_cuentas).ejecutar("ES00 UNO")
    cuenta_2 = CrearCuenta(repo_cuentas).ejecutar("ES00 DOS")
    alimentacion = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    nomina = CrearCategoria(repo_categorias).ejecutar("Nómina")
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=cuenta_1.id,
            categoria_id=alimentacion.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Supermercado",
            importe=Decimal("-30.00"),
            saldo=Decimal("970.00"),
        )
    )
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=cuenta_2.id,
            categoria_id=alimentacion.id,
            fecha_valor=datetime.date(2026, 1, 2),
            descripcion="Restaurante",
            importe=Decimal("-20.00"),
            saldo=Decimal("480.00"),
        )
    )
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=cuenta_1.id,
            categoria_id=nomina.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Nómina",
            importe=Decimal("1500.00"),
            saldo=Decimal("1000.00"),
        )
    )

    resumen = ObtenerResumenDashboard(repo_cuentas, repo_categorias, repo_movimientos).ejecutar()

    gastos = {t.categoria_id: t.total for t in resumen.gastos_por_categoria}
    ingresos = {t.categoria_id: t.total for t in resumen.ingresos_por_categoria}
    assert gastos == {alimentacion.id: Decimal("-50.00")}
    assert ingresos == {nomina.id: Decimal("1500.00")}
    assert alimentacion.id not in ingresos
    assert nomina.id not in gastos
