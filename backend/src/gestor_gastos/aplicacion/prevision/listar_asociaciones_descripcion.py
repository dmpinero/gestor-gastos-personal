from gestor_gastos.dominio.prevision.entidades import AsociacionDescripcion
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociacionesDescripcion


class ListarAsociacionesDescripcion:
    def __init__(self, repositorio: RepositorioAsociacionesDescripcion) -> None:
        self._repositorio = repositorio

    def ejecutar(self) -> list[AsociacionDescripcion]:
        return self._repositorio.listar()
