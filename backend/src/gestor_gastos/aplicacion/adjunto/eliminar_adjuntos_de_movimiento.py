from gestor_gastos.dominio.adjunto.almacen import AlmacenAdjuntos
from gestor_gastos.dominio.adjunto.repositorio import RepositorioAdjuntos


class EliminarAdjuntosDeMovimiento:
    """Borra del disco los ficheros de todos los adjuntos de un movimiento.

    No borra las filas de `adjuntos_movimiento`: eso lo hace ya la base de
    datos sola, por el `ondelete="CASCADE"` de la FK a `movimientos.id`, en
    cuanto se borra el movimiento. Quien llama a este caso de uso debe
    hacerlo ANTES de borrar el movimiento (o los movimientos en bloque de
    una cuenta/categoría/subcategoría), para no perder la referencia al
    nombre de fichero con el que localizar y borrar cada adjunto en disco.
    """

    def __init__(self, repositorio_adjuntos: RepositorioAdjuntos, almacen: AlmacenAdjuntos) -> None:
        self._repositorio_adjuntos = repositorio_adjuntos
        self._almacen = almacen

    def ejecutar(self, movimiento_id: int) -> None:
        for adjunto in self._repositorio_adjuntos.listar_por_movimiento(movimiento_id):
            self._almacen.eliminar(adjunto.nombre_almacenado)
