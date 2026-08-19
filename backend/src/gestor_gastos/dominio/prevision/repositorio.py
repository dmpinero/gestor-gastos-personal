from typing import Protocol

from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto


class RepositorioPrevisiones(Protocol):
    """Puerto de persistencia para ConceptoPrevisto."""

    def crear(self, concepto: ConceptoPrevisto) -> ConceptoPrevisto: ...

    def obtener_por_id(self, id_concepto: int) -> ConceptoPrevisto | None: ...

    def listar(self) -> list[ConceptoPrevisto]: ...

    def actualizar(self, concepto: ConceptoPrevisto) -> ConceptoPrevisto: ...

    def eliminar(self, id_concepto: int) -> None: ...
