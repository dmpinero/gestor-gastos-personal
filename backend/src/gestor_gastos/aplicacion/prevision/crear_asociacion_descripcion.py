from gestor_gastos.aplicacion.prevision.normalizar_descripcion_asociacion import (
    normalizar_descripcion_asociacion,
)
from gestor_gastos.aplicacion.prevision.validar_categoria_y_subcategoria import (
    validar_categoria_y_subcategoria,
)
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import AsociacionDuplicadaError
from gestor_gastos.dominio.prevision.entidades import AsociacionDescripcion
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociacionesDescripcion


class CrearAsociacionDescripcion:
    def __init__(
        self,
        repositorio: RepositorioAsociacionesDescripcion,
        repositorio_categorias: RepositorioCategorias,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_categorias = repositorio_categorias

    def ejecutar(
        self,
        categoria_resumen_id: int,
        subcategoria_resumen_id: int | None,
        descripcion: str,
    ) -> AsociacionDescripcion:
        validar_categoria_y_subcategoria(
            categoria_resumen_id, subcategoria_resumen_id, self._repositorio_categorias
        )

        descripcion_normalizada = normalizar_descripcion_asociacion(descripcion)

        if self._repositorio.obtener_por_descripcion(descripcion_normalizada) is not None:
            raise AsociacionDuplicadaError(
                "Ya existe una asociación para esa descripción de movimientos"
            )

        return self._repositorio.crear(
            AsociacionDescripcion(
                categoria_resumen_id=categoria_resumen_id,
                subcategoria_resumen_id=subcategoria_resumen_id,
                descripcion=descripcion_normalizada,
            )
        )
