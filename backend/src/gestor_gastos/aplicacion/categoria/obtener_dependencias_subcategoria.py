from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.categoria.valores import DependenciasSubcategoria
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.repositorio import RepositorioPrevisiones


class ObtenerDependenciasSubcategoria:
    def __init__(
        self,
        repositorio: RepositorioCategorias,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_previsiones: RepositorioPrevisiones,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos
        self._repositorio_previsiones = repositorio_previsiones

    def ejecutar(self, id_subcategoria: int) -> DependenciasSubcategoria:
        if self._repositorio.obtener_subcategoria_por_id(id_subcategoria) is None:
            raise EntidadNoEncontradaError(f"No existe la subcategoría con id {id_subcategoria}")

        return DependenciasSubcategoria(
            movimientos=self._repositorio_movimientos.contar_movimientos_por_subcategoria(
                id_subcategoria
            ),
            conceptos_previstos=self._repositorio_previsiones.contar_por_subcategoria(
                id_subcategoria
            ),
        )
