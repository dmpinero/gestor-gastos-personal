from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto
from gestor_gastos.dominio.prevision.repositorio import RepositorioPrevisiones


class MarcarConceptoPrevistoCancelado:
    def __init__(self, repositorio: RepositorioPrevisiones) -> None:
        self._repositorio = repositorio

    def ejecutar(self, id_concepto: int, cancelado: bool) -> ConceptoPrevisto:
        concepto = self._repositorio.obtener_por_id(id_concepto)
        if concepto is None:
            raise EntidadNoEncontradaError(f"No existe el concepto previsto con id {id_concepto}")

        concepto.cancelado = cancelado
        return self._repositorio.actualizar(concepto)
