import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class MovimientoCrearEsquema(BaseModel):
    cuenta_id: int
    categoria_id: int
    subcategoria_id: int | None = None
    fecha_valor: datetime.date
    descripcion: str = Field(min_length=1, max_length=500)
    comentario: str | None = Field(default=None, max_length=500)
    importe: Decimal = Field(max_digits=12, decimal_places=2)
    saldo: Decimal = Field(max_digits=12, decimal_places=2)


class MovimientoActualizarEsquema(MovimientoCrearEsquema):
    pass


class MovimientoSalidaEsquema(BaseModel):
    id: int
    cuenta_id: int
    categoria_id: int
    subcategoria_id: int | None
    fecha_valor: datetime.date
    descripcion: str
    comentario: str | None
    importe: Decimal
    saldo: Decimal
