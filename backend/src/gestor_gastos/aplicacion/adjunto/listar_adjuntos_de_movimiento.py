from gestor_gastos.dominio.adjunto.entidades import Adjunto
from gestor_gastos.dominio.adjunto.repositorio import RepositorioAdjuntos


class ListarAdjuntosDeMovimiento:
    def __init__(self, repositorio_adjuntos: RepositorioAdjuntos) -> None:
        self._repositorio_adjuntos = repositorio_adjuntos

    def ejecutar(self, movimiento_id: int) -> list[Adjunto]:
        return self._repositorio_adjuntos.listar_por_movimiento(movimiento_id)
