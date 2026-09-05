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
    # None cuando el movimiento se creó a mano o se importó de un Excel; "pdf"
    # cuando vino de un certificado de movimientos en PDF (sin categoría en el
    # fichero de origen, así que interesa poder identificarlos en la interfaz
    # para revisar la categoría/subcategoría que se les asignó automáticamente).
    origen: str | None = None
