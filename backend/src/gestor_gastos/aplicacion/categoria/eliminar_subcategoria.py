from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadConDependenciasError, EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class EliminarSubcategoria:
    def __init__(
        self, repositorio: RepositorioCategorias, repositorio_movimientos: RepositorioMovimientos
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos

    def ejecutar(self, id_subcategoria: int, cascada: bool = False) -> None:
        if self._repositorio.obtener_subcategoria_por_id(id_subcategoria) is None:
            raise EntidadNoEncontradaError(f"No existe la subcategoría con id {id_subcategoria}")

        num_movimientos = self._repositorio_movimientos.contar_movimientos_por_subcategoria(
            id_subcategoria
        )
        if num_movimientos > 0:
            if not cascada:
                raise EntidadConDependenciasError(
                    "No se puede eliminar la subcategoría: tiene movimientos asociados"
                )
            self._repositorio_movimientos.eliminar_movimientos_por_subcategoria(id_subcategoria)

        self._repositorio.eliminar_subcategoria(id_subcategoria)
