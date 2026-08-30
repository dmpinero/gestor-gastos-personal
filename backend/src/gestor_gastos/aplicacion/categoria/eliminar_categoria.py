from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadConDependenciasError, EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAsociaciones,
    RepositorioAsociacionesDescripcion,
    RepositorioPrevisiones,
)


class EliminarCategoria:
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

    def ejecutar(self, id_categoria: int, cascada: bool = False) -> None:
        if self._repositorio.obtener_categoria_por_id(id_categoria) is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {id_categoria}")

        num_subcategorias = self._repositorio.contar_subcategorias(id_categoria)
        num_movimientos = self._repositorio_movimientos.contar_movimientos_por_categoria(
            id_categoria
        )
        num_conceptos_previstos = self._repositorio_previsiones.contar_por_categoria(id_categoria)
        num_asociaciones = self._repositorio_asociaciones.contar_por_categoria(id_categoria)
        num_asociaciones_descripcion = (
            self._repositorio_asociaciones_descripcion.contar_por_categoria(  # noqa: E501
                id_categoria
            )
        )
        if (
            num_subcategorias > 0
            or num_movimientos > 0
            or num_conceptos_previstos > 0
            or num_asociaciones > 0
            or num_asociaciones_descripcion > 0
        ) and (not cascada):
            raise EntidadConDependenciasError(
                "No se puede eliminar la categoría: tiene subcategorías, movimientos, "
                "conceptos previstos o asociaciones de conceptos asociados"
            )

        if num_movimientos > 0:
            self._repositorio_movimientos.eliminar_movimientos_por_categoria(id_categoria)
        if num_conceptos_previstos > 0:
            self._repositorio_previsiones.eliminar_por_categoria(id_categoria)
        if num_asociaciones > 0:
            self._repositorio_asociaciones.eliminar_por_categoria(id_categoria)
        if num_asociaciones_descripcion > 0:
            self._repositorio_asociaciones_descripcion.eliminar_por_categoria(id_categoria)
        if num_subcategorias > 0:
            self._repositorio.eliminar_subcategorias_de(id_categoria)

        self._repositorio.eliminar_categoria(id_categoria)
