import datetime
import random

from gestor_gastos.scripts.sembrar_datos_demo import (
    _CATEGORIAS,
    _CONCEPTOS_PREVISTOS,
    _GASTOS_FIJOS_MENSUALES,
    _GASTOS_VARIABLES,
    _generar_movimientos,
    _generar_transferencias_ahorro,
    _meses_entre,
)


def _subcategorias_validas(nombre_categoria: str, nombre_subcategoria: str | None) -> bool:
    if nombre_subcategoria is None:
        return True
    return nombre_subcategoria in _CATEGORIAS.get(nombre_categoria, [])


def test_todos_los_gastos_fijos_referencian_categorias_y_subcategorias_existentes() -> None:
    for categoria, subcategoria, *_resto in _GASTOS_FIJOS_MENSUALES:
        assert categoria in _CATEGORIAS, categoria
        assert _subcategorias_validas(categoria, subcategoria), (categoria, subcategoria)


def test_todos_los_gastos_variables_referencian_categorias_y_subcategorias_existentes() -> None:
    for categoria, subcategoria, *_resto in _GASTOS_VARIABLES:
        assert categoria in _CATEGORIAS, categoria
        assert _subcategorias_validas(categoria, subcategoria), (categoria, subcategoria)


def test_todos_los_conceptos_previstos_referencian_categorias_y_subcategorias_existentes() -> None:
    for categoria, subcategoria, *_resto in _CONCEPTOS_PREVISTOS:
        assert categoria in _CATEGORIAS, categoria
        assert _subcategorias_validas(categoria, subcategoria), (categoria, subcategoria)


def test_meses_entre_enero_y_marzo_del_mismo_anio_devuelve_los_tres_meses() -> None:
    meses = _meses_entre(datetime.date(2025, 1, 15), datetime.date(2025, 3, 1))

    assert meses == [
        datetime.date(2025, 1, 1),
        datetime.date(2025, 2, 1),
        datetime.date(2025, 3, 1),
    ]


def test_meses_entre_cruzando_de_anio() -> None:
    meses = _meses_entre(datetime.date(2024, 12, 1), datetime.date(2025, 1, 1))

    assert meses == [datetime.date(2024, 12, 1), datetime.date(2025, 1, 1)]


def test_generar_movimientos_nunca_produce_fechas_posteriores_a_hoy() -> None:
    hoy = datetime.date(2026, 10, 13)
    meses = _meses_entre(datetime.date(2025, 1, 1), hoy)

    movimientos = _generar_movimientos(random.Random(1), meses, hoy)

    assert all(fecha <= hoy for fecha, *_resto in movimientos)
    assert any(fecha == hoy for fecha, *_resto in movimientos) or hoy.day < 5


def test_mes_recien_empezado_no_incluye_gastos_fijos_de_dias_posteriores() -> None:
    hoy = datetime.date(2026, 10, 2)
    meses = _meses_entre(hoy, hoy)

    movimientos = _generar_movimientos(random.Random(1), meses, hoy)

    # El alquiler (día 1) y la nómina (día 1) sí caben; la factura de luz
    # (día 5) y la cuota de comunidad (día 3) todavía no.
    descripciones = {descripcion for _fecha, descripcion, *_resto in movimientos}
    assert "Factura luz y gas" not in descripciones
    assert "Cuota comunidad de propietarios" not in descripciones
    assert all(fecha <= hoy for fecha, *_resto in movimientos)


def test_generar_transferencias_ahorro_omite_el_mes_en_curso_si_no_ha_llegado_el_dia_2() -> None:
    hoy = datetime.date(2026, 10, 1)
    meses = _meses_entre(datetime.date(2026, 9, 1), hoy)

    fechas = _generar_transferencias_ahorro(meses, hoy)

    assert fechas == [datetime.date(2026, 9, 2)]
