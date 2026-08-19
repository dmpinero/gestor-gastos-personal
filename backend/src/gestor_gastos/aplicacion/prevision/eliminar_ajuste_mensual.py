from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAjustesMensuales,
    RepositorioPrevisiones,
)


class EliminarAjusteMensual:
    def __init__(
        self,
        repositorio: RepositorioPrevisiones,
        repositorio_ajustes: RepositorioAjustesMensuales,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_ajustes = repositorio_ajustes

    def ejecutar(self, id_concepto: int, anio: int, mes: int) -> None:
        if self._repositorio.obtener_por_id(id_concepto) is None:
            raise EntidadNoEncontradaError(f"No existe el concepto previsto con id {id_concepto}")

        self._repositorio_ajustes.eliminar(id_concepto, anio, mes)
