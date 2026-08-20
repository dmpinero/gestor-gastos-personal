from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadConDependenciasError, EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.repositorio import RepositorioPrevisiones


class EliminarSubcategoria:
    def __init__(
        self,
        repositorio: RepositorioCategorias,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_previsiones: RepositorioPrevisiones,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos
        self._repositorio_previsiones = repositorio_previsiones

    def ejecutar(self, id_subcategoria: int, cascada: bool = False) -> None:
        if self._repositorio.obtener_subcategoria_por_id(id_subcategoria) is None:
            raise EntidadNoEncontradaError(f"No existe la subcategoría con id {id_subcategoria}")

        num_movimientos = self._repositorio_movimientos.contar_movimientos_por_subcategoria(
            id_subcategoria
        )
        num_conceptos_previstos = self._repositorio_previsiones.contar_por_subcategoria(
            id_subcategoria
        )
        if num_movimientos > 0 or num_conceptos_previstos > 0:
            if not cascada:
                raise EntidadConDependenciasError(
                    "No se puede eliminar la subcategoría: tiene movimientos o conceptos "
                    "previstos asociados"
                )
            if num_movimientos > 0:
                self._repositorio_movimientos.eliminar_movimientos_por_subcategoria(id_subcategoria)
            if num_conceptos_previstos > 0:
                self._repositorio_previsiones.eliminar_por_subcategoria(id_subcategoria)

        self._repositorio.eliminar_subcategoria(id_subcategoria)
