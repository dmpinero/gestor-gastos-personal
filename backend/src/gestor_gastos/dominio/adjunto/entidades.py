import datetime
from dataclasses import dataclass


@dataclass
class Adjunto:
    movimiento_id: int
    nombre_original: str
    nombre_almacenado: str
    tipo_mime: str | None
    tamanio_bytes: int
    fecha_subida: datetime.datetime
    id: int | None = None
