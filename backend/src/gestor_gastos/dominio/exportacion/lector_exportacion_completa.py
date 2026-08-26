from typing import Protocol

from gestor_gastos.dominio.exportacion.valores import DatosCompletos


class LectorExportacionCompleta(Protocol):
    """Puerto que lee y valida el Excel de datos completos (formato generado
    por EscritorExportacionCompleta) para poder restaurarlo."""

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosCompletos: ...
