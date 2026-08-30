from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociaciones


def resolver_categoria_movimiento_real(
    concepto: ConceptoPrevisto, repositorio_asociaciones: RepositorioAsociaciones
) -> tuple[int, int | None]:
    """Resuelve la categoría/subcategoría real de movimientos que corresponde
    a un concepto del resumen anual, a través de su AsociacionConcepto si
    tiene una, o la propia categoría/subcategoría del concepto si no."""
    asociacion = repositorio_asociaciones.obtener_por_categoria_resumen(
        concepto.categoria_id, concepto.subcategoria_id
    )
    if asociacion is not None:
        return asociacion.categoria_movimiento_id, asociacion.subcategoria_movimiento_id
    return concepto.categoria_id, concepto.subcategoria_id
