from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import AsociacionDuplicadaError, EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.entidades import AsociacionConcepto
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociaciones


class CrearAsociacion:
    def __init__(
        self,
        repositorio: RepositorioAsociaciones,
        repositorio_categorias: RepositorioCategorias,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_categorias = repositorio_categorias

    def ejecutar(
        self,
        categoria_resumen_id: int,
        subcategoria_resumen_id: int | None,
        categoria_movimiento_id: int,
        subcategoria_movimiento_id: int | None,
    ) -> AsociacionConcepto:
        self._validar_categoria_y_subcategoria(categoria_resumen_id, subcategoria_resumen_id)
        self._validar_categoria_y_subcategoria(categoria_movimiento_id, subcategoria_movimiento_id)

        if (
            self._repositorio.obtener_por_categoria_resumen(
                categoria_resumen_id, subcategoria_resumen_id
            )
            is not None
        ):
            raise AsociacionDuplicadaError(
                "Ya existe una asociación para esa categoría/subcategoría del resumen anual"
            )

        return self._repositorio.crear(
            AsociacionConcepto(
                categoria_resumen_id=categoria_resumen_id,
                subcategoria_resumen_id=subcategoria_resumen_id,
                categoria_movimiento_id=categoria_movimiento_id,
                subcategoria_movimiento_id=subcategoria_movimiento_id,
            )
        )

    def _validar_categoria_y_subcategoria(
        self, categoria_id: int, subcategoria_id: int | None
    ) -> None:
        if self._repositorio_categorias.obtener_categoria_por_id(categoria_id) is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {categoria_id}")

        if subcategoria_id is not None:
            subcategoria = self._repositorio_categorias.obtener_subcategoria_por_id(subcategoria_id)
            if subcategoria is None or subcategoria.categoria_id != categoria_id:
                raise EntidadNoEncontradaError(
                    f"No existe la subcategoría con id {subcategoria_id} "
                    f"en la categoría {categoria_id}"
                )
