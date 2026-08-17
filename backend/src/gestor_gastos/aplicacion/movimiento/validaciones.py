from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError


def validar_referencias(
    repositorio_cuentas: RepositorioCuentas,
    repositorio_categorias: RepositorioCategorias,
    cuenta_id: int,
    categoria_id: int,
    subcategoria_id: int | None,
) -> None:
    """Comprueba que cuenta, categoría y (si se indica) subcategoría existen.

    Evita que una referencia inválida llegue a la base de datos como un
    IntegrityError de bajo nivel; el dominio la traduce a un 404 claro.
    """
    if repositorio_cuentas.obtener_por_id(cuenta_id) is None:
        raise EntidadNoEncontradaError(f"No existe la cuenta con id {cuenta_id}")

    if repositorio_categorias.obtener_categoria_por_id(categoria_id) is None:
        raise EntidadNoEncontradaError(f"No existe la categoría con id {categoria_id}")

    if (
        subcategoria_id is not None
        and repositorio_categorias.obtener_subcategoria_por_id(subcategoria_id) is None
    ):
        raise EntidadNoEncontradaError(f"No existe la subcategoría con id {subcategoria_id}")
