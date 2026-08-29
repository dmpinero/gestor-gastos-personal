from gestor_gastos.dominio.prevision.entidades import AsociacionConcepto
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociaciones


class ListarAsociaciones:
    def __init__(self, repositorio: RepositorioAsociaciones) -> None:
        self._repositorio = repositorio

    def ejecutar(self) -> list[AsociacionConcepto]:
        return self._repositorio.listar()
