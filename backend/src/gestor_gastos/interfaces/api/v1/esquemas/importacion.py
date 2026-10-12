import datetime
from decimal import Decimal

from pydantic import BaseModel

from gestor_gastos.interfaces.api.v1.esquemas.movimiento import MovimientoSalidaEsquema


class FilaMovimientoExcelEsquema(BaseModel):
    fecha_valor: datetime.date
    categoria: str
    subcategoria: str | None
    descripcion: str
    comentario: str | None
    importe: Decimal
    saldo: Decimal


class DuplicadoDetectadoEsquema(BaseModel):
    fila_excel: FilaMovimientoExcelEsquema
    movimiento_existente: MovimientoSalidaEsquema


class ResumenImportacionEsquema(BaseModel):
    cuenta_id: int
    movimientos_importados: int
    movimientos_omitidos_por_duplicado: int
    categorias_creadas: list[str]
    subcategorias_creadas: list[str]
    duplicados: list[DuplicadoDetectadoEsquema] = []


class CabeceraExcelEsquema(BaseModel):
    numero_cuenta: str
    titular: str | None


class FilaPropuestaEsquema(BaseModel):
    fecha_valor: datetime.date
    descripcion: str
    comentario: str | None
    importe: Decimal
    saldo: Decimal
    categoria: str
    subcategoria: str | None
    categoria_original_excel: str
    subcategoria_original_excel: str | None
    propuesta_automatica: bool


class AnalisisImportacionExcelEsquema(BaseModel):
    cabecera: CabeceraExcelEsquema
    filas: list[FilaPropuestaEsquema]
