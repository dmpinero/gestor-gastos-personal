import datetime
from decimal import Decimal

from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.notificaciones.deteccion import detectar_proximos_eventos


def _movimiento(
    descripcion: str,
    fecha_valor: datetime.date,
    importe: Decimal = Decimal("-10.00"),
    categoria_id: int = 1,
    subcategoria_id: int | None = None,
) -> Movimiento:
    return Movimiento(
        cuenta_id=1,
        categoria_id=categoria_id,
        subcategoria_id=subcategoria_id,
        fecha_valor=fecha_valor,
        descripcion=descripcion,
        importe=importe,
        saldo=Decimal("0.00"),
    )


def test_dos_ocurrencias_anuales_predice_mismo_dia_el_anio_siguiente() -> None:
    movimientos = [
        _movimiento("AMAZON PRIME", datetime.date(2024, 10, 1), importe=Decimal("-36.00")),
        _movimiento("AMAZON PRIME", datetime.date(2025, 10, 1), importe=Decimal("-36.00")),
    ]

    eventos = detectar_proximos_eventos(movimientos, hoy=datetime.date(2025, 10, 2))

    assert len(eventos) == 1
    evento = eventos[0]
    assert evento.descripcion == "AMAZON PRIME"
    assert evento.periodicidad == "anual"
    assert evento.fecha_ultimo_real == datetime.date(2025, 10, 1)
    assert evento.fecha_prevista == datetime.date(2026, 10, 1)
    assert evento.importe_estimado == Decimal("-36.00")


def test_una_sola_ocurrencia_no_predice_nada() -> None:
    movimientos = [_movimiento("NETFLIX", datetime.date(2025, 1, 1))]

    assert detectar_proximos_eventos(movimientos, hoy=datetime.date(2025, 6, 1)) == []


def test_intervalo_irregular_se_descarta() -> None:
    movimientos = [
        _movimiento("TRANSFERENCIA VARIOS", datetime.date(2025, 1, 1)),
        _movimiento("TRANSFERENCIA VARIOS", datetime.date(2025, 2, 15)),  # 45 días: ninguna banda
    ]

    assert detectar_proximos_eventos(movimientos, hoy=datetime.date(2025, 3, 1)) == []


def test_se_descarta_si_deberia_haber_recurrido_y_no_lo_hizo() -> None:
    # Dos cargos mensuales consecutivos (enero, febrero), pero para mayo ya
    # deberían haber aparecido marzo, abril y mayo y no hay ninguno: se
    # considera dado de baja (p. ej. una hipoteca ya pagada), no un próximo
    # evento real.
    movimientos = [
        _movimiento("HIPOTECA ING", datetime.date(2025, 1, 5), importe=Decimal("-900.00")),
        _movimiento("HIPOTECA ING", datetime.date(2025, 2, 5), importe=Decimal("-900.00")),
    ]

    assert detectar_proximos_eventos(movimientos, hoy=datetime.date(2025, 5, 10)) == []


def test_si_no_hace_falta_saltar_ningun_periodo_sigue_activa() -> None:
    movimientos = [
        _movimiento("SPOTIFY", datetime.date(2025, 8, 5), importe=Decimal("-9.99")),
        _movimiento("SPOTIFY", datetime.date(2025, 9, 5), importe=Decimal("-9.99")),
    ]

    eventos = detectar_proximos_eventos(movimientos, hoy=datetime.date(2025, 9, 20))

    assert len(eventos) == 1
    assert eventos[0].periodicidad == "mensual"
    assert eventos[0].fecha_prevista == datetime.date(2025, 10, 5)


def test_ocurrencias_anteriores_a_los_dos_ultimos_anios_no_cuentan() -> None:
    # Solo cuentan el año en curso y el anterior para decidir si algo sigue
    # recurriendo: estas dos ocurrencias son de hace más de dos años.
    movimientos = [
        _movimiento("REVISTA ANUAL", datetime.date(2022, 6, 1)),
        _movimiento("REVISTA ANUAL", datetime.date(2023, 6, 1)),
    ]

    assert detectar_proximos_eventos(movimientos, hoy=datetime.date(2025, 1, 1)) == []


def test_anual_cuyo_aniversario_de_este_anio_aun_no_ha_llegado_sigue_detectandose() -> None:
    # El IBI se cobra en diciembre: visto desde octubre, el aniversario de
    # este año todavía no ha pasado, así que sus dos últimas ocurrencias
    # reales caen en dos años "antiguos" distintos (2024 y 2025) respecto al
    # año en curso (2026). La ventana de actividad es móvil (últimos ~2
    # años), no un par de años de calendario fijo, para que esto no se
    # descarte por error.
    movimientos = [
        _movimiento("RECIBO IBI", datetime.date(2024, 12, 1), importe=Decimal("-400.00")),
        _movimiento("RECIBO IBI", datetime.date(2025, 12, 1), importe=Decimal("-400.00")),
    ]

    eventos = detectar_proximos_eventos(movimientos, hoy=datetime.date(2026, 10, 3))

    assert len(eventos) == 1
    assert eventos[0].periodicidad == "anual"
    assert eventos[0].fecha_prevista == datetime.date(2026, 12, 1)


def test_gastos_e_ingresos_recurrentes_activos_se_detectan_por_separado_y_ordenados() -> None:
    movimientos = [
        _movimiento("AMAZON PRIME", datetime.date(2024, 9, 1), importe=Decimal("-36.00")),
        _movimiento("AMAZON PRIME", datetime.date(2025, 9, 1), importe=Decimal("-36.00")),
        _movimiento("NOMINA EMPRESA", datetime.date(2025, 8, 1), importe=Decimal("1500.00")),
        _movimiento("NOMINA EMPRESA", datetime.date(2025, 9, 1), importe=Decimal("1500.00")),
    ]

    eventos = detectar_proximos_eventos(movimientos, hoy=datetime.date(2025, 9, 15))

    assert [e.descripcion for e in eventos] == ["NOMINA EMPRESA", "AMAZON PRIME"]
    assert eventos[0].fecha_prevista == datetime.date(2025, 10, 1)
    assert eventos[1].fecha_prevista == datetime.date(2026, 9, 1)


def test_gasto_mensual_usa_el_importe_medio_de_los_ultimos_24_meses() -> None:
    movimientos = [
        _movimiento("GIMNASIO", datetime.date(2024, 2, 1), importe=Decimal("-30.00")),
        _movimiento("GIMNASIO", datetime.date(2024, 6, 1), importe=Decimal("-30.00")),
        _movimiento("GIMNASIO", datetime.date(2025, 10, 1), importe=Decimal("-40.00")),
        _movimiento("GIMNASIO", datetime.date(2025, 11, 1), importe=Decimal("-50.00")),
        _movimiento("GIMNASIO", datetime.date(2025, 12, 1), importe=Decimal("-30.00")),
    ]

    eventos = detectar_proximos_eventos(movimientos, hoy=datetime.date(2025, 12, 20))

    assert len(eventos) == 1
    assert eventos[0].fecha_prevista == datetime.date(2026, 1, 1)
    # Media de los 5 importes: todos caen dentro de los últimos 24 meses
    # desde el 2025-12-20 (desde 2023-12-20) → (-30-30-40-50-30)/5 = -36.00,
    # no el último importe real (-30.00).
    assert eventos[0].importe_estimado == Decimal("-36.00")


def test_el_promedio_de_24_meses_solo_aplica_a_gastos_mensuales() -> None:
    hoy = datetime.date(2025, 9, 20)
    movimientos = [
        _movimiento("SEGURO HOGAR", datetime.date(2024, 9, 1), importe=Decimal("-100.00")),
        _movimiento("SEGURO HOGAR", datetime.date(2025, 9, 1), importe=Decimal("-120.00")),
        _movimiento("NOMINA", datetime.date(2025, 8, 1), importe=Decimal("1500.00")),
        _movimiento("NOMINA", datetime.date(2025, 9, 1), importe=Decimal("1600.00")),
    ]

    eventos = detectar_proximos_eventos(movimientos, hoy=hoy)

    seguro = next(e for e in eventos if e.descripcion == "SEGURO HOGAR")
    nomina = next(e for e in eventos if e.descripcion == "NOMINA")
    # Un gasto anual usa el último importe real, no una media (solo aplica a
    # gastos mensuales). Un ingreso mensual también usa el último importe
    # real: la media de 24 meses solo tiene sentido para gastos.
    assert seguro.importe_estimado == Decimal("-120.00")
    assert nomina.importe_estimado == Decimal("1600.00")
