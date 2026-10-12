from dataclasses import dataclass, field
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
    # False si este concepto nunca ha tenido ni un movimiento real ni un
    # ajuste manual en NINGÚN año (p. ej. recién creado): el frontend no
    # debe ocultarlo nunca, por mucho que el año que se esté viendo no
    # tenga actividad, o un concepto nuevo se quedaría sin forma de
    # introducirle su primer valor (no se puede pulsar una celda de una
    # fila que no se ve). Solo si esto es True tiene sentido ocultar la
    # fila por falta de actividad en el año concreto que se está viendo.
    tiene_historial_real: bool = True


@dataclass(frozen=True)
class ResumenAnual:
    anio: int
    filas_gastos: list[FilaResumenAnual]
    filas_ingresos: list[FilaResumenAnual]
    totales_gastos: list[Decimal]
    totales_ingresos: list[Decimal]


@dataclass(frozen=True)
class CeldaResumenAnualExcel:
    """Una celda (concepto, año, mes) leída del Excel de Resumen anual.

    `importe` es None si la celda está vacía en el fichero.
    """

    concepto_id: int
    anio: int
    mes: int
    importe: Decimal | None


@dataclass(frozen=True)
class DatosResumenAnualExcelLeidos:
    celdas: list[CeldaResumenAnualExcel]


@dataclass
class ResumenImportacionResumenAnual:
    celdas_actualizadas: int = 0
    celdas_eliminadas: int = 0
    conceptos_no_encontrados: int = 0


@dataclass(frozen=True)
class FilaConceptoPrevistoExcel:
    """Una fila leída del Excel de alta masiva de conceptos previstos."""

    categoria: str
    subcategoria: str | None
    periodicidad: Periodicidad
    importe_previsto: Decimal


@dataclass(frozen=True)
class DatosConceptosPrevistosExcelLeidos:
    filas: list[FilaConceptoPrevistoExcel]


@dataclass
class ResumenImportacionConceptosPrevistos:
    conceptos_creados: int = 0
    conceptos_omitidos_por_duplicado: int = 0
    categorias_creadas: list[str] = field(default_factory=list)
    subcategorias_creadas: list[str] = field(default_factory=list)
