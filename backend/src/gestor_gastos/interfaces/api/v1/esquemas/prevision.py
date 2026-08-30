from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

Periodicidad = Literal["mensual", "trimestral", "semestral", "anual"]


class ConceptoPrevistoCrearEsquema(BaseModel):
    categoria_id: int
    subcategoria_id: int | None = None
    periodicidad: Periodicidad
    # Si se omite en una periodicidad distinta de "mensual", el dominio
    # asume el mes 1 (ver ConceptoPrevisto.meses_aplicables).
    mes_inicio: int | None = Field(default=None, ge=1, le=12)
    importe_previsto: Decimal = Field(max_digits=12, decimal_places=2)


class ConceptoPrevistoActualizarEsquema(ConceptoPrevistoCrearEsquema):
    pass


class ConceptoPrevistoSalidaEsquema(BaseModel):
    id: int
    categoria_id: int
    subcategoria_id: int | None
    periodicidad: Periodicidad
    mes_inicio: int | None
    importe_previsto: Decimal


OrigenValorMensual = Literal["real", "previsto", "ajustado"]


class ValorMensualEsquema(BaseModel):
    mes: int
    importe: Decimal
    origen: OrigenValorMensual


class AjusteMensualEsquema(BaseModel):
    importe: Decimal = Field(max_digits=12, decimal_places=2)


class CargaAcumuladoRealEsquema(BaseModel):
    meses_actualizados: int


class FilaResumenAnualEsquema(BaseModel):
    concepto_id: int
    categoria_id: int
    subcategoria_id: int | None
    nombre: str
    periodicidad: Periodicidad
    valores: list[ValorMensualEsquema]


class ResumenAnualEsquema(BaseModel):
    anio: int
    filas_gastos: list[FilaResumenAnualEsquema]
    filas_ingresos: list[FilaResumenAnualEsquema]
    totales_gastos: list[Decimal]
    totales_ingresos: list[Decimal]


class ResumenImportacionResumenAnualEsquema(BaseModel):
    celdas_actualizadas: int
    celdas_eliminadas: int
    conceptos_no_encontrados: int


class ResumenImportacionConceptosPrevistosEsquema(BaseModel):
    conceptos_creados: int
    conceptos_omitidos_por_duplicado: int
    categorias_creadas: list[str]
    subcategorias_creadas: list[str]


class AsociacionConceptoCrearEsquema(BaseModel):
    categoria_resumen_id: int
    subcategoria_resumen_id: int | None = None
    categoria_movimiento_id: int
    subcategoria_movimiento_id: int | None = None


class AsociacionConceptoSalidaEsquema(BaseModel):
    id: int
    categoria_resumen_id: int
    subcategoria_resumen_id: int | None
    categoria_movimiento_id: int
    subcategoria_movimiento_id: int | None


class AsociacionDescripcionCrearEsquema(BaseModel):
    categoria_resumen_id: int
    subcategoria_resumen_id: int | None = None
    descripcion: str = Field(min_length=1, max_length=500)


class AsociacionDescripcionSalidaEsquema(BaseModel):
    id: int
    categoria_resumen_id: int
    subcategoria_resumen_id: int | None
    descripcion: str
