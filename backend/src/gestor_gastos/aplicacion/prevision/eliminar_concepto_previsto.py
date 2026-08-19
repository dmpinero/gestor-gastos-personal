from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.repositorio import RepositorioPrevisiones


class EliminarConceptoPrevisto:
    def __init__(self, repositorio: RepositorioPrevisiones) -> None:
        self._repositorio = repositorio

    def ejecutar(self, id_concepto: int) -> None:
        if self._repositorio.obtener_por_id(id_concepto) is None:
            raise EntidadNoEncontradaError(f"No existe el concepto previsto con id {id_concepto}")
        self._repositorio.eliminar(id_concepto)
