from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.categoria.valores import DependenciasCategoria
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class ObtenerDependenciasCategoria:
    def __init__(
        self, repositorio: RepositorioCategorias, repositorio_movimientos: RepositorioMovimientos
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos

    def ejecutar(self, id_categoria: int) -> DependenciasCategoria:
        if self._repositorio.obtener_categoria_por_id(id_categoria) is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {id_categoria}")

        return DependenciasCategoria(
            subcategorias=self._repositorio.contar_subcategorias(id_categoria),
            movimientos=self._repositorio_movimientos.contar_movimientos_por_categoria(
                id_categoria
            ),
        )
