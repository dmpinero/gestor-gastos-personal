import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class ProximoEventoEsquema(BaseModel):
    descripcion: str
    categoria_id: int
    subcategoria_id: int | None
    importe_estimado: Decimal
    fecha_prevista: datetime.date
    fecha_ultimo_real: datetime.date
    periodicidad: Literal["mensual", "trimestral", "semestral", "anual"]
