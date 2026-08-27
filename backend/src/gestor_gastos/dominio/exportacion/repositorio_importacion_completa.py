from typing import Protocol

from gestor_gastos.dominio.exportacion.valores import DatosCompletos


class RepositorioImportacionCompleta(Protocol):
    """Puerto que sustituye todo el contenido de las 6 tablas de la
    aplicación por los datos dados, en una única operación atómica."""

    def reemplazar_todo(self, datos: DatosCompletos) -> None: ...
