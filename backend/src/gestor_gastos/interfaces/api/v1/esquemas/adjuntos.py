import datetime

from pydantic import BaseModel


class AdjuntoEsquema(BaseModel):
    id: int
    movimiento_id: int
    nombre_original: str
    tipo_mime: str | None
    tamanio_bytes: int
    fecha_subida: datetime.datetime


class ConteoAdjuntosEsquema(BaseModel):
    movimiento_id: int
    cantidad: int
