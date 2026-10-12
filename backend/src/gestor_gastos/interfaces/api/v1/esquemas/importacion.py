import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from gestor_gastos.interfaces.api.v1.esquemas.movimiento import MovimientoSalidaEsquema

# Límites de longitud/precisión alineados con las columnas de la BD (ver
# modelos.py: String(120/64/200/500), Numeric(12, 2)): sin ellos, un valor
# desmesurado no se rechaza aquí con un 422 limpio, sino que provoca un error
# de BD sin manejar al intentar insertarlo (mismo motivo que ya usan, p. ej.,
# MovimientoCrearEsquema y ConceptoPrevistoCrearEsquema).
_LONGITUD_CATEGORIA = 120
_LONGITUD_DESCRIPCION = 500
_LONGITUD_NUMERO_CUENTA = 64
_LONGITUD_TITULAR = 200


class FilaMovimientoExcelEsquema(BaseModel):
    fecha_valor: datetime.date
    categoria: str = Field(max_length=_LONGITUD_CATEGORIA)
    subcategoria: str | None = Field(default=None, max_length=_LONGITUD_CATEGORIA)
    descripcion: str = Field(max_length=_LONGITUD_DESCRIPCION)
    comentario: str | None = Field(default=None, max_length=_LONGITUD_DESCRIPCION)
    importe: Decimal = Field(max_digits=12, decimal_places=2)
    saldo: Decimal = Field(max_digits=12, decimal_places=2)


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
    numero_cuenta: str = Field(max_length=_LONGITUD_NUMERO_CUENTA)
    titular: str | None = Field(default=None, max_length=_LONGITUD_TITULAR)


class FilaPropuestaEsquema(BaseModel):
    fecha_valor: datetime.date
    descripcion: str = Field(max_length=_LONGITUD_DESCRIPCION)
    comentario: str | None = Field(default=None, max_length=_LONGITUD_DESCRIPCION)
    importe: Decimal = Field(max_digits=12, decimal_places=2)
    saldo: Decimal = Field(max_digits=12, decimal_places=2)
    categoria: str = Field(max_length=_LONGITUD_CATEGORIA)
    subcategoria: str | None = Field(default=None, max_length=_LONGITUD_CATEGORIA)
    categoria_original_excel: str = Field(max_length=_LONGITUD_CATEGORIA)
    subcategoria_original_excel: str | None = Field(default=None, max_length=_LONGITUD_CATEGORIA)
    propuesta_automatica: bool


class AnalisisImportacionExcelEsquema(BaseModel):
    cabecera: CabeceraExcelEsquema
    filas: list[FilaPropuestaEsquema]
