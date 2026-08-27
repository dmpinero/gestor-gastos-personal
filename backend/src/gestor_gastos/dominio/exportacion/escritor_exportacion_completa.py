from typing import Protocol

from gestor_gastos.dominio.exportacion.valores import DatosCompletos


class EscritorExportacionCompleta(Protocol):
    """Puerto que genera el Excel del volcado completo a partir de su contenido."""

    def escribir(self, datos: DatosCompletos) -> bytes: ...
