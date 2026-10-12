from gestor_gastos.aplicacion.adjunto.eliminar_adjuntos_de_movimiento import (
    EliminarAdjuntosDeMovimiento,
)
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class EliminarMovimiento:
    def __init__(
        self,
        repositorio: RepositorioMovimientos,
        eliminar_adjuntos_de_movimiento: EliminarAdjuntosDeMovimiento,
    ) -> None:
        self._repositorio = repositorio
        self._eliminar_adjuntos_de_movimiento = eliminar_adjuntos_de_movimiento

    def ejecutar(self, id_movimiento: int) -> None:
        if self._repositorio.obtener_por_id(id_movimiento) is None:
            raise EntidadNoEncontradaError(f"No existe el movimiento con id {id_movimiento}")

        self._eliminar_adjuntos_de_movimiento.ejecutar(id_movimiento)
        self._repositorio.eliminar(id_movimiento)
