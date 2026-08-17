import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class Movimiento:
    cuenta_id: int
    categoria_id: int
    fecha_valor: datetime.date
    descripcion: str
    importe: Decimal
    saldo: Decimal
    id: int | None = None
    subcategoria_id: int | None = None
    comentario: str | None = None
