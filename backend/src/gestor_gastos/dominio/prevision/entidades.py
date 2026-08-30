from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

Periodicidad = Literal["mensual", "trimestral", "semestral", "anual"]

_INTERVALO_MESES: dict[Periodicidad, int] = {
    "trimestral": 3,
    "semestral": 6,
    "anual": 12,
}


@dataclass
class ConceptoPrevisto:
    categoria_id: int
    subcategoria_id: int | None
    periodicidad: Periodicidad
    importe_previsto: Decimal
    mes_inicio: int | None = None
    id: int | None = None

    def meses_aplicables(self) -> set[int]:
        """Meses (1-12) en los que este concepto tiene una ocurrencia prevista."""
        if self.periodicidad == "mensual":
            return set(range(1, 13))
        intervalo = _INTERVALO_MESES[self.periodicidad]
        inicio = self.mes_inicio or 1
        return {((inicio - 1 + i * intervalo) % 12) + 1 for i in range(12 // intervalo)}


@dataclass
class AjusteMensual:
    """Importe manual que un usuario fija para una celda (concepto, año, mes)
    concreta, con prioridad sobre el importe real y el previsto en el resumen
    anual."""

    concepto_id: int
    anio: int
    mes: int
    importe: Decimal
    id: int | None = None


@dataclass
class AsociacionConcepto:
    """Hace corresponder la categoría/subcategoría con la que se nombra un
    concepto previsto del resumen anual con la categoría/subcategoría real
    que usan los movimientos, cuando ambas representan el mismo gasto pero
    con nombres distintos (p. ej. "Comida" en el resumen anual y
    "Alimentación" en movimientos). ObtenerResumenAnual la usa para buscar
    el importe real de un concepto por la categoría/subcategoría de
    movimientos, en vez de por la suya propia."""

    categoria_resumen_id: int
    subcategoria_resumen_id: int | None
    categoria_movimiento_id: int
    subcategoria_movimiento_id: int | None
    id: int | None = None


@dataclass
class AsociacionDescripcion:
    """Hace corresponder una descripción (o un fragmento de ella) de
    movimientos reales con la categoría/subcategoría con la que se nombra un
    concepto previsto del resumen anual, para casos que una AsociacionConcepto
    por categoría no cubre (p. ej. un recibo con descripción propia que no
    comparte categoría/subcategoría con ningún otro movimiento). Su importe
    real se SUMA al de la categoría/subcategoría de movimientos asociada, si
    la hay (ver ObtenerResumenAnual)."""

    categoria_resumen_id: int
    subcategoria_resumen_id: int | None
    descripcion: str
    id: int | None = None
