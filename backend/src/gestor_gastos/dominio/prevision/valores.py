from dataclasses import dataclass
from decimal import Decimal

from gestor_gastos.dominio.prevision.entidades import Periodicidad


@dataclass(frozen=True)
class ValorMensual:
    mes: int
    importe: Decimal
    es_previsto: bool


@dataclass(frozen=True)
class FilaResumenAnual:
    concepto_id: int
    categoria_id: int
    subcategoria_id: int | None
    nombre: str
    periodicidad: Periodicidad
    valores: list[ValorMensual]


@dataclass(frozen=True)
class ResumenAnual:
    anio: int
    filas_gastos: list[FilaResumenAnual]
    filas_ingresos: list[FilaResumenAnual]
    totales_gastos: list[Decimal]
    totales_ingresos: list[Decimal]
