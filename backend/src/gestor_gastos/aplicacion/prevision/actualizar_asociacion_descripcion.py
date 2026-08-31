from gestor_gastos.aplicacion.prevision.validar_categoria_y_subcategoria import (
    validar_categoria_y_subcategoria,
)
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import AsociacionDuplicadaError, EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.entidades import AsociacionDescripcion
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociacionesDescripcion


class ActualizarAsociacionDescripcion:
    def __init__(
        self,
        repositorio: RepositorioAsociacionesDescripcion,
        repositorio_categorias: RepositorioCategorias,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_categorias = repositorio_categorias

    def ejecutar(
        self,
        id_asociacion: int,
        categoria_resumen_id: int,
        subcategoria_resumen_id: int | None,
        descripcion: str,
    ) -> AsociacionDescripcion:
        asociacion = self._repositorio.obtener_por_id(id_asociacion)
        if asociacion is None:
            raise EntidadNoEncontradaError(f"No existe la asociación con id {id_asociacion}")

        validar_categoria_y_subcategoria(
            categoria_resumen_id, subcategoria_resumen_id, self._repositorio_categorias
        )

        descripcion_normalizada = descripcion.strip()

        existente = self._repositorio.obtener_por_descripcion(descripcion_normalizada)
        if existente is not None and existente.id != id_asociacion:
            raise AsociacionDuplicadaError(
                "Ya existe una asociación para esa descripción de movimientos"
            )

        asociacion.categoria_resumen_id = categoria_resumen_id
        asociacion.subcategoria_resumen_id = subcategoria_resumen_id
        asociacion.descripcion = descripcion_normalizada
        return self._repositorio.actualizar(asociacion)
