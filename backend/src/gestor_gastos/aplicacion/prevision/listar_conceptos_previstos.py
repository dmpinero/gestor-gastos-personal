from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto
from gestor_gastos.dominio.prevision.repositorio import RepositorioPrevisiones


class ListarConceptosPrevistos:
    def __init__(self, repositorio: RepositorioPrevisiones) -> None:
        self._repositorio = repositorio

    def ejecutar(self) -> list[ConceptoPrevisto]:
        return self._repositorio.listar()
