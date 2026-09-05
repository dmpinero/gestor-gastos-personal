import datetime
from decimal import Decimal

from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
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


def test_crear_persiste_el_origen_y_actualizar_no_lo_borra(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    creado = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Pago en Amazon Prime",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
            origen="pdf",
        )
    )
    assert creado.origen == "pdf"

    otra_categoria = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_categoria(
        Categoria(nombre="Suscripciones")
    )
    actualizado = repositorio.actualizar(
        Movimiento(
            id=creado.id,
            cuenta_id=cuenta.id,
            categoria_id=otra_categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Pago en Amazon Prime",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )

    # ActualizarMovimiento no conoce el origen: se ignora deliberadamente al
    # actualizar, para que editar el movimiento no borre la marca de PDF.
    assert actualizado.categoria_id == otra_categoria.id
    assert actualizado.origen == "pdf"


def test_buscar_duplicado(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    creado = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Compra",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )

    duplicado = repositorio.buscar_duplicado(
        cuenta.id, datetime.date(2026, 1, 1), Decimal("-10.00"), Decimal("100.00"), "Compra"
    )
    assert duplicado is not None
    assert duplicado.id == creado.id

    assert (
        repositorio.buscar_duplicado(
            cuenta.id, datetime.date(2026, 1, 2), Decimal("-10.00"), Decimal("100.00"), "Compra"
        )
        is None
    )


def test_buscar_duplicado_ignora_diferencias_de_espaciado_en_la_descripcion(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    creado = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Recibo C.P. C  CASTILLA REAL",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )

    duplicado = repositorio.buscar_duplicado(
        cuenta.id,
        datetime.date(2026, 1, 1),
        Decimal("-10.00"),
        Decimal("100.00"),
        "Recibo C.P. C CASTILLA REAL",
    )

    assert duplicado is not None
    assert duplicado.id == creado.id


def test_contar_movimientos_por_cuenta_categoria_y_subcategoria(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)

    assert repositorio.contar_movimientos_por_cuenta(cuenta.id) == 0

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

    assert repositorio.contar_movimientos_por_cuenta(cuenta.id) == 1
    assert repositorio.contar_movimientos_por_categoria(categoria.id) == 1
    assert repositorio.contar_movimientos_por_subcategoria(999) == 0


def test_eliminar_movimientos_por_cuenta_categoria_y_subcategoria(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    movimiento = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Compra",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )

    repositorio.eliminar_movimientos_por_cuenta(cuenta.id)

    assert repositorio.obtener_por_id(movimiento.id) is None


def test_actualizar_categoria_de_movimientos_por_subcategoria(sesion_bd) -> None:
    cuenta, categoria_origen = _preparar_cuenta_y_categoria(sesion_bd)
    categoria_destino = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_categoria(
        Categoria(nombre="Hogar")
    )
    subcategoria = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_subcategoria(
        Subcategoria(nombre="Cafes", categoria_id=categoria_origen.id)
    )
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    movimiento = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria_origen.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Café",
            importe=Decimal("-3.50"),
            saldo=Decimal("100.00"),
        )
    )

    repositorio.actualizar_categoria_de_movimientos_por_subcategoria(
        subcategoria.id, categoria_destino.id
    )

    assert repositorio.obtener_por_id(movimiento.id).categoria_id == categoria_destino.id


def test_sumar_movimientos_por_mes(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    subcategoria = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_subcategoria(
        Subcategoria(nombre="Cafes", categoria_id=categoria.id)
    )
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 3, 5),
            descripcion="Café 1",
            importe=Decimal("-3.00"),
            saldo=Decimal("100.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 3, 20),
            descripcion="Café 2",
            importe=Decimal("-2.50"),
            saldo=Decimal("97.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2025, 3, 5),
            descripcion="Otro año",
            importe=Decimal("-99.00"),
            saldo=Decimal("1.00"),
        )
    )

    totales = repositorio.sumar_movimientos_por_mes(2026)

    assert totales[(categoria.id, subcategoria.id, 3)] == Decimal("-5.50")
    # El movimiento de 2025 no debe contar (filtrado por año) ni mezclarse
    # con la clave de la subcategoría (sin subcategoria_id).
    assert (categoria.id, None, 3) not in totales


def test_listar_ids_e_importes_por_descripcion_y_mes_excluye_la_categoria_indicada(
    sesion_bd,
) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    otra_categoria = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_categoria(
        Categoria(nombre="Varios")
    )
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    # Coincide por descripción, pero está en la categoría excluida: no debe
    # sumarse (evita contarlo dos veces si el llamador ya lo suma aparte por
    # esa categoría).
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 3, 5),
            descripcion="Bizum enviado a Sonia",
            importe=Decimal("-50.00"),
            saldo=Decimal("100.00"),
        )
    )
    # Coincide por descripción y está en otra categoría: sí debe sumarse.
    incluido = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=otra_categoria.id,
            fecha_valor=datetime.date(2026, 3, 6),
            descripcion="Bizum enviado a Juan",
            importe=Decimal("-30.00"),
            saldo=Decimal("70.00"),
        )
    )

    resultado = repositorio.listar_ids_e_importes_por_descripcion_y_mes(
        2026, "Bizum enviado", categoria.id, None
    )

    assert resultado == {3: {incluido.id: Decimal("-30.00")}}


def test_obtener_ultimo_saldo(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)

    assert repositorio.obtener_ultimo_saldo(cuenta.id) is None

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

    assert repositorio.obtener_ultimo_saldo(cuenta.id) == Decimal("95.00")


def test_obtener_ultimo_saldo_con_varios_movimientos_en_la_misma_fecha_gana_el_de_menor_id(
    sesion_bd,
) -> None:
    # El extracto del banco no trae hora, solo fecha, y lista los movimientos
    # de un mismo día del más reciente al más antiguo; al importarlos en ese
    # orden, el más reciente de ese día recibe el id más bajo del grupo.
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)

    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 3, 10),
            descripcion="El más reciente del día (primero en el Excel)",
            importe=Decimal("-30.00"),
            saldo=Decimal("70.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 3, 10),
            descripcion="El más antiguo del día (segundo en el Excel)",
            importe=Decimal("-20.00"),
            saldo=Decimal("50.00"),
        )
    )

    assert repositorio.obtener_ultimo_saldo(cuenta.id) == Decimal("70.00")


def test_sumar_gastos_e_ingresos_por_categoria(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    otra_categoria = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_categoria(
        Categoria(nombre="Nómina")
    )
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
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=otra_categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Nómina",
            importe=Decimal("1500.00"),
            saldo=Decimal("1600.00"),
        )
    )

    assert repositorio.sumar_gastos_por_categoria() == {categoria.id: Decimal("-10.00")}
    assert repositorio.sumar_ingresos_por_categoria() == {otra_categoria.id: Decimal("1500.00")}


def test_listar_por_categoria_cruza_cuentas_y_puede_filtrar_solo_gastos(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    otra_cuenta = RepositorioCuentasSqlAlchemy(sesion_bd).crear(
        CuentaBancaria(numero_cuenta="ES01")
    )
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Gasto cuenta 1",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=otra_cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 2),
            descripcion="Gasto cuenta 2",
            importe=Decimal("-20.00"),
            saldo=Decimal("200.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 3),
            descripcion="Ingreso",
            importe=Decimal("500.00"),
            saldo=Decimal("600.00"),
        )
    )

    todos = repositorio.listar_por_categoria(categoria.id)
    assert [m.descripcion for m in todos] == ["Ingreso", "Gasto cuenta 2", "Gasto cuenta 1"]

    solo_gastos = repositorio.listar_por_categoria(categoria.id, solo_gastos=True)
    assert [m.descripcion for m in solo_gastos] == ["Gasto cuenta 2", "Gasto cuenta 1"]


def test_listar_por_subcategoria_cruza_cuentas(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    subcategoria = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_subcategoria(
        Subcategoria(nombre="Supermercado", categoria_id=categoria.id)
    )
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    movimiento = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Compra súper",
            importe=Decimal("-10.00"),
            saldo=Decimal("100.00"),
        )
    )

    movimientos = repositorio.listar_por_subcategoria(subcategoria.id)

    assert [m.id for m in movimientos] == [movimiento.id]


def test_listar_por_categoria_y_mes_filtra_categoria_subcategoria_anio_y_mes(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    subcategoria = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_subcategoria(
        Subcategoria(nombre="Cafes", categoria_id=categoria.id)
    )
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    encaja = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 3, 5),
            descripcion="Café marzo",
            importe=Decimal("-3.00"),
            saldo=Decimal("100.00"),
        )
    )
    # Mismo mes/año pero sin la subcategoría: no debe aparecer.
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 3, 6),
            descripcion="Sin subcategoría",
            importe=Decimal("-1.00"),
            saldo=Decimal("99.00"),
        )
    )
    # Mismo mes/categoría/subcategoría pero otro año: no debe aparecer.
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2025, 3, 5),
            descripcion="Otro año",
            importe=Decimal("-9.00"),
            saldo=Decimal("1.00"),
        )
    )
    # Mismo año/categoría/subcategoría pero otro mes: no debe aparecer.
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 4, 5),
            descripcion="Otro mes",
            importe=Decimal("-9.00"),
            saldo=Decimal("1.00"),
        )
    )

    movimientos = repositorio.listar_por_categoria_y_mes(categoria.id, subcategoria.id, 2026, 3)

    assert [m.id for m in movimientos] == [encaja.id]


def test_listar_por_categoria_y_mes_con_subcategoria_none_exige_movimientos_sin_subcategoria(
    sesion_bd,
) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    subcategoria = RepositorioCategoriasSqlAlchemy(sesion_bd).crear_subcategoria(
        Subcategoria(nombre="Cafes", categoria_id=categoria.id)
    )
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    sin_subcategoria = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 3, 5),
            descripcion="Sin subcategoría",
            importe=Decimal("-1.00"),
            saldo=Decimal("99.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 3, 6),
            descripcion="Con subcategoría",
            importe=Decimal("-2.00"),
            saldo=Decimal("97.00"),
        )
    )

    movimientos = repositorio.listar_por_categoria_y_mes(categoria.id, None, 2026, 3)

    assert [m.id for m in movimientos] == [sin_subcategoria.id]


def test_listar_por_descripcion_y_mes_filtra_por_fragmento_anio_y_mes(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    encaja = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 3, 5),
            descripcion="Recibo Ayuntamiento Las Rozas",
            importe=Decimal("-40.00"),
            saldo=Decimal("60.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 3, 6),
            descripcion="Otra descripción",
            importe=Decimal("-1.00"),
            saldo=Decimal("59.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2025, 3, 5),
            descripcion="Recibo Ayuntamiento Las Rozas",
            importe=Decimal("-40.00"),
            saldo=Decimal("1.00"),
        )
    )

    movimientos = repositorio.listar_por_descripcion_y_mes("ayuntamiento las rozas", 2026, 3)

    assert [m.id for m in movimientos] == [encaja.id]


def test_listar_por_descripcion_filtra_por_fragmento_sin_restringir_la_fecha(sesion_bd) -> None:
    cuenta, categoria = _preparar_cuenta_y_categoria(sesion_bd)
    repositorio = RepositorioMovimientosSqlAlchemy(sesion_bd)
    encaja_2026 = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 3, 5),
            descripcion="Recibo Ayuntamiento Las Rozas",
            importe=Decimal("-40.00"),
            saldo=Decimal("60.00"),
        )
    )
    encaja_2018 = repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2018, 1, 10),
            descripcion="Recibo Ayuntamiento Las Rozas",
            importe=Decimal("-35.00"),
            saldo=Decimal("500.00"),
        )
    )
    repositorio.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 3, 6),
            descripcion="Otra descripción",
            importe=Decimal("-1.00"),
            saldo=Decimal("59.00"),
        )
    )

    movimientos = repositorio.listar_por_descripcion("ayuntamiento las rozas")

    assert {m.id for m in movimientos} == {encaja_2026.id, encaja_2018.id}
