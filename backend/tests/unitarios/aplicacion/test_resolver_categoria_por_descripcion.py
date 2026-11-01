from gestor_gastos.aplicacion.importacion.resolver_categoria_por_descripcion import (
    cargar_asociaciones_normalizadas,
    resolver_categoria_por_descripcion,
)
from gestor_gastos.dominio.prevision.entidades import AsociacionDescripcion
from tests.unitarios.aplicacion.dobles import RepositorioAsociacionesDescripcionFalso


def test_sin_asociaciones_no_hay_coincidencia() -> None:
    assert resolver_categoria_por_descripcion("algo", []) == (None, None)


def test_coincide_por_fragmento_contenido_en_la_descripcion() -> None:
    repo = RepositorioAsociacionesDescripcionFalso()
    repo.crear(
        AsociacionDescripcion(
            categoria_resumen_id=1, subcategoria_resumen_id=2, descripcion="SANITAS"
        )
    )
    asociaciones = cargar_asociaciones_normalizadas(repo)

    resultado = resolver_categoria_por_descripcion("Recibo SANITAS S A DE SEGUROS", asociaciones)

    assert resultado == (1, 2)


def test_no_coincide_si_el_fragmento_no_esta_contenido() -> None:
    repo = RepositorioAsociacionesDescripcionFalso()
    repo.crear(
        AsociacionDescripcion(
            categoria_resumen_id=1, subcategoria_resumen_id=None, descripcion="SANITAS"
        )
    )
    asociaciones = cargar_asociaciones_normalizadas(repo)

    assert resolver_categoria_por_descripcion("Otro comercio", asociaciones) == (None, None)


def test_varias_coincidencias_gana_la_mas_especifica() -> None:
    repo = RepositorioAsociacionesDescripcionFalso()
    repo.crear(
        AsociacionDescripcion(
            categoria_resumen_id=1, subcategoria_resumen_id=None, descripcion="PAYPAL"
        )
    )
    repo.crear(
        AsociacionDescripcion(
            categoria_resumen_id=2, subcategoria_resumen_id=None, descripcion="PAYPAL *DAZN"
        )
    )
    asociaciones = cargar_asociaciones_normalizadas(repo)

    resultado = resolver_categoria_por_descripcion("Pago en PAYPAL *DAZN DE 12345 DE", asociaciones)

    assert resultado == (2, None)


def test_normaliza_espacios_y_mayusculas() -> None:
    repo = RepositorioAsociacionesDescripcionFalso()
    repo.crear(
        AsociacionDescripcion(
            categoria_resumen_id=5, subcategoria_resumen_id=None, descripcion="SANITAS  S A"
        )
    )
    asociaciones = cargar_asociaciones_normalizadas(repo)

    assert resolver_categoria_por_descripcion("sanitas s a de seguros", asociaciones) == (5, None)
