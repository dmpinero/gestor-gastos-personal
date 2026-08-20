from typing import Protocol

from gestor_gastos.dominio.prevision.valores import ResumenAnual


class EscritorExcelResumenAnual(Protocol):
    """Puerto que genera el Excel del Resumen anual a partir de su contenido."""

    def escribir(self, resumen: ResumenAnual) -> bytes: ...
