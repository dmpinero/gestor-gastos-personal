import datetime
from decimal import Decimal

from gestor_gastos.aplicacion.importacion.analizar_importacion_excel import (
    AnalizarImportacionExcel,
)
from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.importacion.valores import (
    CabeceraExcel,
    DatosExcelLeidos,
    FilaMovimientoExcel,
)
from gestor_gastos.dominio.prevision.entidades import AsociacionDescripcion
from tests.unitarios.aplicacion.dobles import (
    RepositorioAsociacionesDescripcionFalso,
    RepositorioCategoriasFalso,
)


def _fila(
    descripcion: str,
    categoria: str = "Varios",
    subcategoria: str | None = None,
) -> FilaMovimientoExcel:
    return FilaMovimientoExcel(
        fecha_valor=datetime.date(2026, 1, 1),
        categoria=categoria,
        subcategoria=subcategoria,
        descripcion=descripcion,
        comentario=None,
        importe=Decimal("-10.00"),
        saldo=Decimal("100.00"),
    )


def _datos(fila: FilaMovimientoExcel) -> DatosExcelLeidos:
    return DatosExcelLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None), filas=[fila]
    )


def test_con_coincidencia_propone_la_categoria_de_la_asociacion() -> None:
    repo_categorias = RepositorioCategoriasFalso()
    repo_asociaciones = RepositorioAsociacionesDescripcionFalso()
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Salud"))
    subcategoria = repo_categorias.crear_subcategoria(
        Subcategoria(nombre="Seguro médico Noelia", categoria_id=categoria.id)
    )
    repo_asociaciones.crear(
        AsociacionDescripcion(
            categoria_resumen_id=categoria.id,
            subcategoria_resumen_id=subcategoria.id,
            descripcion="SANITAS",
        )
    )
    datos = _datos(_fila("Recibo SANITAS S A DE SEGUROS", categoria="Otra categoría del Excel"))

    analisis = AnalizarImportacionExcel(repo_categorias, repo_asociaciones).ejecutar(datos)

    fila = analisis.filas[0]
    assert fila.propuesta_automatica is True
    assert fila.categoria == "Salud"
    assert fila.subcategoria == "Seguro médico Noelia"
    assert fila.categoria_original_excel == "Otra categoría del Excel"
    assert fila.subcategoria_original_excel is None


def test_coincidencia_sin_subcategoria_en_la_asociacion() -> None:
    repo_categorias = RepositorioCategoriasFalso()
    repo_asociaciones = RepositorioAsociacionesDescripcionFalso()
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Transporte"))
    repo_asociaciones.crear(
        AsociacionDescripcion(
            categoria_resumen_id=categoria.id, subcategoria_resumen_id=None, descripcion="RENFE"
        )
    )
    datos = _datos(_fila("Billete RENFE Madrid-Barcelona"))

    analisis = AnalizarImportacionExcel(repo_categorias, repo_asociaciones).ejecutar(datos)

    fila = analisis.filas[0]
    assert fila.propuesta_automatica is True
    assert fila.categoria == "Transporte"
    assert fila.subcategoria is None


def test_sin_coincidencia_mantiene_lo_que_dice_el_excel() -> None:
    repo_categorias = RepositorioCategoriasFalso()
    repo_asociaciones = RepositorioAsociacionesDescripcionFalso()
    datos = _datos(
        _fila("Pago en comercio desconocido", categoria="Ocio", subcategoria="Restaurantes")
    )

    analisis = AnalizarImportacionExcel(repo_categorias, repo_asociaciones).ejecutar(datos)

    fila = analisis.filas[0]
    assert fila.propuesta_automatica is False
    assert fila.categoria == "Ocio"
    assert fila.subcategoria == "Restaurantes"
    assert fila.categoria_original_excel == "Ocio"
    assert fila.subcategoria_original_excel == "Restaurantes"


def test_conserva_fecha_importe_saldo_descripcion_sin_cambios() -> None:
    repo_categorias = RepositorioCategoriasFalso()
    repo_asociaciones = RepositorioAsociacionesDescripcionFalso()
    fila_original = _fila("Pago en comercio")
    datos = _datos(fila_original)

    analisis = AnalizarImportacionExcel(repo_categorias, repo_asociaciones).ejecutar(datos)

    fila = analisis.filas[0]
    assert fila.fecha_valor == fila_original.fecha_valor
    assert fila.descripcion == fila_original.descripcion
    assert fila.importe == fila_original.importe
    assert fila.saldo == fila_original.saldo
