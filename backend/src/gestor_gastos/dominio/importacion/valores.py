import datetime
from dataclasses import dataclass, field
from decimal import Decimal

from gestor_gastos.dominio.movimiento.entidades import Movimiento


@dataclass(frozen=True)
class CabeceraExcel:
    numero_cuenta: str
    titular: str | None


@dataclass(frozen=True)
class FilaMovimientoExcel:
    fecha_valor: datetime.date
    categoria: str
    subcategoria: str | None
    descripcion: str
    comentario: str | None
    importe: Decimal
    saldo: Decimal


@dataclass(frozen=True)
class DatosExcelLeidos:
    cabecera: CabeceraExcel
    filas: list[FilaMovimientoExcel]


@dataclass(frozen=True)
class FilaMovimientoPdf:
    """Como FilaMovimientoExcel, pero sin categoria/subcategoria/comentario:
    el certificado de movimientos en PDF no trae esas columnas, así que se
    resuelven aparte (por asociación de descripción) al importar."""

    fecha_valor: datetime.date
    descripcion: str
    importe: Decimal
    saldo: Decimal


@dataclass(frozen=True)
class DatosPdfLeidos:
    cabecera: CabeceraExcel
    filas: list[FilaMovimientoPdf]


@dataclass(frozen=True)
class DuplicadoDetectado:
    """Una fila del Excel que se omitió por coincidir con un movimiento ya
    existente, junto con ese movimiento, para poder comparar ambos."""

    fila_excel: FilaMovimientoExcel
    movimiento_existente: Movimiento


@dataclass(frozen=True)
class EventoProgreso:
    """Avance de la importación: cuántas filas se han procesado ya, de un total."""

    procesadas: int
    total: int


@dataclass
class ResumenImportacion:
    cuenta_id: int = 0
    movimientos_importados: int = 0
    movimientos_omitidos_por_duplicado: int = 0
    categorias_creadas: list[str] = field(default_factory=list)
    subcategorias_creadas: list[str] = field(default_factory=list)
    duplicados: list[DuplicadoDetectado] = field(default_factory=list)
