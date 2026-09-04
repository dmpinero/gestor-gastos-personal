from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociaciones


def resolver_categoria_movimiento_real(
    categoria_id: int,
    subcategoria_id: int | None,
    repositorio_asociaciones: RepositorioAsociaciones,
) -> tuple[int, int | None]:
    """Resuelve la categoría/subcategoría real de movimientos que corresponde
    a una categoría/subcategoría del resumen (de un concepto del resumen
    anual, o de la que se navega en Historial), a través de su
    AsociacionConcepto si tiene una, o la propia categoría/subcategoría si
    no."""
    asociacion = repositorio_asociaciones.obtener_por_categoria_resumen(
        categoria_id, subcategoria_id
    )
    if asociacion is not None:
        return asociacion.categoria_movimiento_id, asociacion.subcategoria_movimiento_id
    return categoria_id, subcategoria_id
