from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.categoria.valores import DependenciasCategoria
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAsociaciones,
    RepositorioAsociacionesDescripcion,
    RepositorioPrevisiones,
)


class ObtenerDependenciasCategoria:
    def __init__(
        self,
        repositorio: RepositorioCategorias,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_previsiones: RepositorioPrevisiones,
        repositorio_asociaciones: RepositorioAsociaciones,
        repositorio_asociaciones_descripcion: RepositorioAsociacionesDescripcion,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos
        self._repositorio_previsiones = repositorio_previsiones
        self._repositorio_asociaciones = repositorio_asociaciones
        self._repositorio_asociaciones_descripcion = repositorio_asociaciones_descripcion

    def ejecutar(self, id_categoria: int) -> DependenciasCategoria:
        if self._repositorio.obtener_categoria_por_id(id_categoria) is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {id_categoria}")

        return DependenciasCategoria(
            subcategorias=self._repositorio.contar_subcategorias(id_categoria),
            movimientos=self._repositorio_movimientos.contar_movimientos_por_categoria(
                id_categoria
            ),
            conceptos_previstos=self._repositorio_previsiones.contar_por_categoria(id_categoria),
            asociaciones=self._repositorio_asociaciones.contar_por_categoria(id_categoria),
            asociaciones_descripcion=self._repositorio_asociaciones_descripcion.contar_por_categoria(  # noqa: E501
                id_categoria
            ),
        )
