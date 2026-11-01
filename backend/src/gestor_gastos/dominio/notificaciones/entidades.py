import datetime
from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

Periodicidad = Literal["mensual", "trimestral", "semestral", "anual"]


@dataclass
class ProximoEvento:
    """Próxima ocurrencia prevista de un movimiento recurrente, detectada a
    partir del histórico real de movimientos (ver `detectar_proximos_eventos`
    en deteccion.py), no de una configuración manual."""

    descripcion: str
    categoria_id: int
    subcategoria_id: int | None
    importe_estimado: Decimal
    fecha_prevista: datetime.date
    fecha_ultimo_real: datetime.date
    periodicidad: Periodicidad
