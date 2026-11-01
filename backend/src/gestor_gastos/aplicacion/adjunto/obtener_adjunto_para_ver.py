from gestor_gastos.dominio.adjunto.almacen import AlmacenAdjuntos
from gestor_gastos.dominio.adjunto.entidades import Adjunto
from gestor_gastos.dominio.adjunto.repositorio import RepositorioAdjuntos
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError


class ObtenerAdjuntoParaVer:
    def __init__(self, repositorio_adjuntos: RepositorioAdjuntos, almacen: AlmacenAdjuntos) -> None:
        self._repositorio_adjuntos = repositorio_adjuntos
        self._almacen = almacen

    def ejecutar(self, id_adjunto: int) -> tuple[Adjunto, bytes]:
        adjunto = self._repositorio_adjuntos.obtener_por_id(id_adjunto)
        if adjunto is None:
            raise EntidadNoEncontradaError(f"No existe el adjunto con id {id_adjunto}")
        contenido = self._almacen.leer(adjunto.nombre_almacenado)
        return adjunto, contenido
