import datetime
from decimal import Decimal

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.movimiento.crear_movimiento import CrearMovimiento
from gestor_gastos.aplicacion.prevision.listar_movimientos_por_categoria_resumen import (
    ListarMovimientosPorCategoriaResumen,
)
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.prevision.entidades import AsociacionConcepto, AsociacionDescripcion
from tests.unitarios.aplicacion.dobles import (
    RepositorioAsociacionesDescripcionFalso,
    RepositorioAsociacionesFalso,
    RepositorioCategoriasFalso,
    RepositorioCuentasFalso,
    RepositorioMovimientosFalso,
)


def _preparar():
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_cuentas = RepositorioCuentasFalso()
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    return repo_categorias, repo_movimientos, repo_cuentas, cuenta


def test_devuelve_los_movimientos_guardados_literalmente_con_esa_subcategoria() -> None:
    repo_categorias, repo_movimientos, repo_cuentas, cuenta = _preparar()
    suscripciones = CrearCategoria(repo_categorias).ejecutar("Suscripciones")

    movimiento = CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=suscripciones.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Netflix",
        importe=Decimal("-12.99"),
        saldo=Decimal("100.00"),
    )

    movimientos = ListarMovimientosPorCategoriaResumen(
        repo_movimientos,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(suscripciones.id, None)

    assert [m.id for m in movimientos] == [movimiento.id]


def test_encuentra_movimientos_de_otra_categoria_a_traves_de_una_asociacion_por_descripcion() -> (
    None
):
    # Reproduce el caso real de "Amazon Prime": el concepto vive en
    # Suscripciones, pero los movimientos reales están guardados bajo Compras
    # y solo se localizan por su descripción.
    repo_categorias, repo_movimientos, repo_cuentas, cuenta = _preparar()
    suscripciones = CrearCategoria(repo_categorias).ejecutar("Suscripciones")
    compras = CrearCategoria(repo_categorias).ejecutar("Compras")

    movimiento = CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=compras.id,
        fecha_valor=datetime.date(2026, 1, 1),
        descripcion="Pago en Amazon Prime*Z54XF2Y24 LUXEMBOURG LU",
        importe=Decimal("-49.90"),
        saldo=Decimal("100.00"),
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=suscripciones.id,
            subcategoria_resumen_id=None,
            descripcion="Pago en Amazon Prime",
        )
    )

    movimientos = ListarMovimientosPorCategoriaResumen(
        repo_movimientos,
        RepositorioAsociacionesFalso(),
        repo_asociaciones_descripcion,
    ).ejecutar(suscripciones.id, None)

    assert [m.id for m in movimientos] == [movimiento.id]


def test_usa_la_categoria_real_de_una_asociacion_por_concepto() -> None:
    repo_categorias, repo_movimientos, repo_cuentas, cuenta = _preparar()
    comida = CrearCategoria(repo_categorias).ejecutar("Comida")
    alimentacion = CrearCategoria(repo_categorias).ejecutar("Alimentación")

    movimiento = CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=alimentacion.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Supermercado",
        importe=Decimal("-150.00"),
        saldo=Decimal("100.00"),
    )
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=alimentacion.id,
            subcategoria_movimiento_id=None,
        )
    )

    movimientos = ListarMovimientosPorCategoriaResumen(
        repo_movimientos,
        repo_asociaciones,
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(comida.id, None)

    assert [m.id for m in movimientos] == [movimiento.id]


def test_no_duplica_un_movimiento_que_coincide_por_categoria_y_por_descripcion() -> None:
    repo_categorias, repo_movimientos, repo_cuentas, cuenta = _preparar()
    comida = CrearCategoria(repo_categorias).ejecutar("Comida")

    movimiento = CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=comida.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Bizum enviado a Sonia",
        importe=Decimal("-50.00"),
        saldo=Decimal("100.00"),
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            descripcion="Bizum enviado",
        )
    )

    movimientos = ListarMovimientosPorCategoriaResumen(
        repo_movimientos,
        RepositorioAsociacionesFalso(),
        repo_asociaciones_descripcion,
    ).ejecutar(comida.id, None)

    assert [m.id for m in movimientos] == [movimiento.id]


def test_sin_movimientos_ni_asociaciones_devuelve_lista_vacia() -> None:
    repo_categorias, repo_movimientos, _, _ = _preparar()
    vacia = CrearCategoria(repo_categorias).ejecutar("Vacía")

    movimientos = ListarMovimientosPorCategoriaResumen(
        repo_movimientos,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(vacia.id, None)

    assert movimientos == []
