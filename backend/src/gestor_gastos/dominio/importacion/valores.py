import datetime
from dataclasses import dataclass, field
from decimal import Decimal


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


@dataclass
class ResumenImportacion:
    cuenta_id: int = 0
    movimientos_importados: int = 0
    movimientos_omitidos_por_duplicado: int = 0
    categorias_creadas: list[str] = field(default_factory=list)
    subcategorias_creadas: list[str] = field(default_factory=list)
