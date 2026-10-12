import datetime
from collections import defaultdict
from decimal import Decimal

from dateutil.relativedelta import relativedelta

from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.notificaciones.entidades import Periodicidad, ProximoEvento

_MESES_POR_PERIODICIDAD: dict[Periodicidad, int] = {
    "mensual": 1,
    "trimestral": 3,
    "semestral": 6,
    "anual": 12,
}

_BANDAS_DIAS_POR_PERIODICIDAD: dict[Periodicidad, tuple[int, int]] = {
    "mensual": (24, 36),
    "trimestral": (80, 100),
    "semestral": (165, 195),
    "anual": (350, 380),
}

# Para el importe de un gasto mensual se usa la media de los últimos 24
# meses (en vez del último importe real): el importe exacto de un mismo
# recibo puede variar bastante de un mes a otro (luz, gas...), y la media de
# dos años da una estimación más representativa que el último cargo aislado.
_MESES_PARA_IMPORTE_MEDIO = 24

# Ventana de actividad para decidir si algo sigue recurriendo: los últimos
# ~2 años (25 meses, con un mes de margen) desde hoy, en vez de un rango de
# años de calendario fijo. Con años de calendario, un concepto anual cuyo
# aniversario todavía no ha llegado este año (p. ej. el IBI de diciembre,
# visto desde octubre) solo tendría UNA de sus dos últimas ocurrencias
# dentro de "el año en curso y el anterior" (la otra cae en el año
# justo anterior a esos dos) y se descartaría por error. Una ventana móvil
# de 25 meses cubre siempre dos ciclos anuales completos, sea cual sea el
# mes en que estemos.
_MESES_VENTANA_ACTIVIDAD = 25


def _normalizar_descripcion(descripcion: str) -> str:
    """Recorta espacios y colapsa espacios múltiples internos, para que dos
    importaciones del mismo cargo con distinto espaciado (frecuente en
    extractos bancarios) se agrupen como la misma serie recurrente."""
    return " ".join(descripcion.split())


def _clasificar_periodicidad(dias: int) -> Periodicidad | None:
    for periodicidad, (minimo, maximo) in _BANDAS_DIAS_POR_PERIODICIDAD.items():
        if minimo <= dias <= maximo:
            return periodicidad
    return None


def _proyectar_proxima_fecha(
    fecha_ultima: datetime.date, periodicidad: Periodicidad, hoy: datetime.date
) -> tuple[datetime.date, int]:
    """Suma el intervalo de la periodicidad detectada a la fecha del último
    movimiento real, usando meses de calendario (no días fijos) para
    mantener el mismo día del mes/año. Devuelve también cuántos periodos
    completos ha tenido que saltarse para llegar a una fecha futura: cada
    salto significa que debería haber vuelto a recurrir y no lo hizo, la
    señal de que en realidad ya no está activo (ver `detectar_proximos_eventos`)."""
    intervalo = relativedelta(months=_MESES_POR_PERIODICIDAD[periodicidad])
    fecha_prevista = fecha_ultima + intervalo
    periodos_saltados = 0
    while fecha_prevista < hoy:
        fecha_prevista += intervalo
        periodos_saltados += 1
    return fecha_prevista, periodos_saltados


def _importe_medio_ultimos_meses(
    movimientos_del_grupo: list[Movimiento], hoy: datetime.date
) -> Decimal:
    desde = hoy - relativedelta(months=_MESES_PARA_IMPORTE_MEDIO)
    importes = [m.importe for m in movimientos_del_grupo if desde <= m.fecha_valor <= hoy]
    if not importes:
        return max(movimientos_del_grupo, key=lambda m: m.fecha_valor).importe
    return (sum(importes) / len(importes)).quantize(Decimal("0.01"))


def detectar_proximos_eventos(
    movimientos: list[Movimiento], hoy: datetime.date
) -> list[ProximoEvento]:
    """Agrupa `movimientos` por descripción y, para cada grupo, decide si
    sigue recurriendo activamente a partir de los últimos ~2 años (ver
    `_MESES_VENTANA_ACTIVIDAD`): solo esas ocurrencias recientes se usan para
    detectar la periodicidad, ignorando cargos muy antiguos que ya no
    reflejan el comportamiento actual (p. ej. una versión antigua del texto
    de un recibo que luego cambió de redacción, o un comercio con el que solo
    coincidió el texto por casualidad).

    Si, aun así, hiciera falta saltarse al menos un periodo completo para
    llegar a una fecha futura (ver `_proyectar_proxima_fecha`), el grupo se
    descarta entero: debería haber vuelto a recurrir y no lo hizo, así que ya
    no está activo (p. ej. una hipoteca ya pagada, una suscripción
    cancelada) y no tiene sentido seguir prediciéndolo."""
    desde_actividad = hoy - relativedelta(months=_MESES_VENTANA_ACTIVIDAD)

    grupos: dict[str, list[Movimiento]] = defaultdict(list)
    for movimiento in movimientos:
        grupos[_normalizar_descripcion(movimiento.descripcion)].append(movimiento)

    eventos: list[ProximoEvento] = []
    for movimientos_grupo in grupos.values():
        ocurrencias_recientes = sorted(
            (m for m in movimientos_grupo if desde_actividad <= m.fecha_valor <= hoy),
            key=lambda m: m.fecha_valor,
        )
        if len(ocurrencias_recientes) < 2:
            continue

        penultimo, ultimo = ocurrencias_recientes[-2], ocurrencias_recientes[-1]
        dias = (ultimo.fecha_valor - penultimo.fecha_valor).days

        periodicidad = _clasificar_periodicidad(dias)
        if periodicidad is None:
            continue

        fecha_prevista, periodos_saltados = _proyectar_proxima_fecha(
            ultimo.fecha_valor, periodicidad, hoy
        )
        if periodos_saltados > 0:
            continue

        importe_estimado = ultimo.importe
        if periodicidad == "mensual" and ultimo.importe < 0:
            importe_estimado = _importe_medio_ultimos_meses(movimientos_grupo, hoy)

        eventos.append(
            ProximoEvento(
                descripcion=ultimo.descripcion,
                categoria_id=ultimo.categoria_id,
                subcategoria_id=ultimo.subcategoria_id,
                importe_estimado=importe_estimado,
                fecha_prevista=fecha_prevista,
                fecha_ultimo_real=ultimo.fecha_valor,
                periodicidad=periodicidad,
            )
        )

    eventos.sort(key=lambda evento: evento.fecha_prevista)
    return eventos
