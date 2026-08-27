from gestor_gastos.dominio.prevision.entidades import AjusteMensual
from gestor_gastos.dominio.prevision.repositorio import RepositorioAjustesMensuales


class ListarTodosLosAjustes:
    def __init__(self, repositorio: RepositorioAjustesMensuales) -> None:
        self._repositorio = repositorio

    def ejecutar(self) -> list[AjusteMensual]:
        return self._repositorio.listar_todos()
