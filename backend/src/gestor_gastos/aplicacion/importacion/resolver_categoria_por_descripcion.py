from gestor_gastos.aplicacion.prevision.normalizar_descripcion_asociacion import (
    normalizar_descripcion_asociacion,
)
from gestor_gastos.dominio.prevision.entidades import AsociacionDescripcion
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociacionesDescripcion

AsociacionConFragmento = tuple[str, AsociacionDescripcion]


def cargar_asociaciones_normalizadas(
    repositorio: RepositorioAsociacionesDescripcion,
) -> list[AsociacionConFragmento]:
    return [
        (normalizar_descripcion_asociacion(a.descripcion).lower(), a) for a in repositorio.listar()
    ]


def resolver_categoria_por_descripcion(
    descripcion: str, asociaciones: list[AsociacionConFragmento]
) -> tuple[int | None, int | None]:
    """Busca, entre `asociaciones` (ya normalizadas, ver
    `cargar_asociaciones_normalizadas`), la que coincida con `descripcion`
    como subcadena. Si varias coinciden, gana la más específica (el
    fragmento de descripción original más largo). `categoria_resumen_id`/
    `subcategoria_resumen_id` de `AsociacionDescripcion` son IDs reales de
    `categorias`/`subcategorias` (las mismas que usan los movimientos), así
    que se devuelven y usan tal cual, sin ninguna traducción intermedia."""
    descripcion_normalizada = normalizar_descripcion_asociacion(descripcion).lower()
    candidatas = [
        asociacion for fragmento, asociacion in asociaciones if fragmento in descripcion_normalizada
    ]
    if not candidatas:
        return None, None
    mejor = max(candidatas, key=lambda a: len(a.descripcion))
    return mejor.categoria_resumen_id, mejor.subcategoria_resumen_id
