from typing import Protocol

from gestor_gastos.dominio.prevision.valores import ResumenAnual


class EscritorExcelResumenAnual(Protocol):
    """Puerto que genera el Excel del Resumen anual, uno por cada año del rango."""

    def escribir(self, resumenes: list[ResumenAnual]) -> bytes: ...
