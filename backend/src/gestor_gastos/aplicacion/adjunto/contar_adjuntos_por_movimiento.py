from gestor_gastos.dominio.adjunto.repositorio import RepositorioAdjuntos


class ContarAdjuntosPorMovimiento:
    def __init__(self, repositorio_adjuntos: RepositorioAdjuntos) -> None:
        self._repositorio_adjuntos = repositorio_adjuntos

    def ejecutar(self) -> dict[int, int]:
        return self._repositorio_adjuntos.contar_por_movimiento_de_todos()
