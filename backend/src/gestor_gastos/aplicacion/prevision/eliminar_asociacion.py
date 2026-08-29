from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociaciones


class EliminarAsociacion:
    def __init__(self, repositorio: RepositorioAsociaciones) -> None:
        self._repositorio = repositorio

    def ejecutar(self, id_asociacion: int) -> None:
        if self._repositorio.obtener_por_id(id_asociacion) is None:
            raise EntidadNoEncontradaError(f"No existe la asociación con id {id_asociacion}")
        self._repositorio.eliminar(id_asociacion)
