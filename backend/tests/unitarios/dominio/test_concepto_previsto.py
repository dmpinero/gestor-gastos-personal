from decimal import Decimal

from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto


def _concepto(periodicidad: str, mes_inicio: int | None = None) -> ConceptoPrevisto:
    return ConceptoPrevisto(
        categoria_id=1,
        subcategoria_id=None,
        periodicidad=periodicidad,  # type: ignore[arg-type]
        importe_previsto=Decimal("-10.00"),
        mes_inicio=mes_inicio,
    )


def test_mensual_se_aplica_todos_los_meses() -> None:
    assert _concepto("mensual").meses_aplicables() == set(range(1, 13))


def test_trimestral_se_aplica_cada_tres_meses_desde_el_inicio() -> None:
    assert _concepto("trimestral", mes_inicio=2).meses_aplicables() == {2, 5, 8, 11}


def test_semestral_se_aplica_cada_seis_meses_desde_el_inicio() -> None:
    assert _concepto("semestral", mes_inicio=3).meses_aplicables() == {3, 9}


def test_anual_se_aplica_solo_en_el_mes_de_inicio() -> None:
    assert _concepto("anual", mes_inicio=7).meses_aplicables() == {7}


def test_no_mensual_sin_mes_inicio_asume_enero() -> None:
    assert _concepto("anual").meses_aplicables() == {1}
