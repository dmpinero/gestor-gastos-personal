from gestor_gastos.dominio.adjunto.almacen import AlmacenAdjuntos
from gestor_gastos.dominio.adjunto.repositorio import RepositorioAdjuntos
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError


class EliminarAdjunto:
    def __init__(self, repositorio_adjuntos: RepositorioAdjuntos, almacen: AlmacenAdjuntos) -> None:
        self._repositorio_adjuntos = repositorio_adjuntos
        self._almacen = almacen

    def ejecutar(self, id_adjunto: int) -> None:
        adjunto = self._repositorio_adjuntos.obtener_por_id(id_adjunto)
        if adjunto is None:
            raise EntidadNoEncontradaError(f"No existe el adjunto con id {id_adjunto}")
        self._almacen.eliminar(adjunto.nombre_almacenado)
        self._repositorio_adjuntos.eliminar(id_adjunto)
