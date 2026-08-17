from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadConDependenciasError, EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class EliminarCategoria:
    def __init__(
        self, repositorio: RepositorioCategorias, repositorio_movimientos: RepositorioMovimientos
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos

    def ejecutar(self, id_categoria: int) -> None:
        if self._repositorio.obtener_categoria_por_id(id_categoria) is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {id_categoria}")

        if self._repositorio.tiene_subcategorias(id_categoria):
            raise EntidadConDependenciasError(
                "No se puede eliminar la categoría: tiene subcategorías asociadas"
            )
        if self._repositorio_movimientos.existen_movimientos_de_categoria(id_categoria):
            raise EntidadConDependenciasError(
                "No se puede eliminar la categoría: tiene movimientos asociados"
            )

        self._repositorio.eliminar_categoria(id_categoria)
