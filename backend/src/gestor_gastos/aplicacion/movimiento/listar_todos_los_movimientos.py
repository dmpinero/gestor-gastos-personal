from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class ListarTodosLosMovimientos:
    def __init__(self, repositorio: RepositorioMovimientos) -> None:
        self._repositorio = repositorio

    def ejecutar(self) -> list[Movimiento]:
        return self._repositorio.listar_todos()
