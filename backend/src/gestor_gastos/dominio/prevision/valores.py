from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from gestor_gastos.dominio.prevision.entidades import Periodicidad

OrigenValorMensual = Literal["real", "previsto", "ajustado"]


@dataclass(frozen=True)
class ValorMensual:
    mes: int
    importe: Decimal
    origen: OrigenValorMensual


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
