from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import AsociacionDuplicadaError, EntidadNoEncontradaError
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
        if self._repositorio_categorias.obtener_categoria_por_id(categoria_resumen_id) is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {categoria_resumen_id}")
        if subcategoria_resumen_id is not None:
            subcategoria = self._repositorio_categorias.obtener_subcategoria_por_id(
                subcategoria_resumen_id
            )
            if subcategoria is None or subcategoria.categoria_id != categoria_resumen_id:
                raise EntidadNoEncontradaError(
                    f"No existe la subcategoría con id {subcategoria_resumen_id} "
                    f"en la categoría {categoria_resumen_id}"
                )

        descripcion_normalizada = descripcion.strip()

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
