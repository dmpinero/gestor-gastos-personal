from gestor_gastos.aplicacion.prevision.validar_categoria_y_subcategoria import (
    validar_categoria_y_subcategoria,
)
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import AsociacionDuplicadaError, EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.entidades import AsociacionConcepto
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociaciones


class ActualizarAsociacion:
    def __init__(
        self,
        repositorio: RepositorioAsociaciones,
        repositorio_categorias: RepositorioCategorias,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_categorias = repositorio_categorias

    def ejecutar(
        self,
        id_asociacion: int,
        categoria_resumen_id: int,
        subcategoria_resumen_id: int | None,
        categoria_movimiento_id: int,
        subcategoria_movimiento_id: int | None,
    ) -> AsociacionConcepto:
        asociacion = self._repositorio.obtener_por_id(id_asociacion)
        if asociacion is None:
            raise EntidadNoEncontradaError(f"No existe la asociación con id {id_asociacion}")

        validar_categoria_y_subcategoria(
            categoria_resumen_id, subcategoria_resumen_id, self._repositorio_categorias
        )
        validar_categoria_y_subcategoria(
            categoria_movimiento_id, subcategoria_movimiento_id, self._repositorio_categorias
        )

        existente = self._repositorio.obtener_por_categoria_resumen(
            categoria_resumen_id, subcategoria_resumen_id
        )
        if existente is not None and existente.id != id_asociacion:
            raise AsociacionDuplicadaError(
                "Ya existe una asociación para esa categoría/subcategoría del resumen anual"
            )

        asociacion.categoria_resumen_id = categoria_resumen_id
        asociacion.subcategoria_resumen_id = subcategoria_resumen_id
        asociacion.categoria_movimiento_id = categoria_movimiento_id
        asociacion.subcategoria_movimiento_id = subcategoria_movimiento_id
        return self._repositorio.actualizar(asociacion)
