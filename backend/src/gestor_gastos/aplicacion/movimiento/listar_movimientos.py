from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class ListarMovimientos:
    def __init__(self, repositorio: RepositorioMovimientos) -> None:
        self._repositorio = repositorio

    def ejecutar(self, cuenta_id: int) -> list[Movimiento]:
        return self._repositorio.listar_por_cuenta(cuenta_id)
