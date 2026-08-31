from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError


def validar_categoria_y_subcategoria(
    categoria_id: int,
    subcategoria_id: int | None,
    repositorio_categorias: RepositorioCategorias,
) -> None:
    if repositorio_categorias.obtener_categoria_por_id(categoria_id) is None:
        raise EntidadNoEncontradaError(f"No existe la categoría con id {categoria_id}")

    if subcategoria_id is not None:
        subcategoria = repositorio_categorias.obtener_subcategoria_por_id(subcategoria_id)
        if subcategoria is None or subcategoria.categoria_id != categoria_id:
            raise EntidadNoEncontradaError(
                f"No existe la subcategoría con id {subcategoria_id} en la categoría {categoria_id}"
            )
