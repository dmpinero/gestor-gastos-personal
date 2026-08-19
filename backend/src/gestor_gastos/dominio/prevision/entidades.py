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
