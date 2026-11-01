from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioConceptosCancelados,
    RepositorioPrevisiones,
)


class MarcarConceptoPrevistoCancelado:
    def __init__(
        self,
        repositorio: RepositorioPrevisiones,
        repositorio_cancelados: RepositorioConceptosCancelados,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_cancelados = repositorio_cancelados

    def ejecutar(self, id_concepto: int, anio: int, cancelado: bool) -> None:
        if self._repositorio.obtener_por_id(id_concepto) is None:
            raise EntidadNoEncontradaError(f"No existe el concepto previsto con id {id_concepto}")

        self._repositorio_cancelados.establecer(id_concepto, anio, cancelado)
