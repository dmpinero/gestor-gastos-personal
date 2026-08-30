from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.prevision.crear_concepto_previsto import CrearConceptoPrevisto
from gestor_gastos.aplicacion.prevision.exportar_resumen_anual_excel import (
    ExportarResumenAnualExcel,
)
from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.dominio.excepciones import FiltroDeListadoInvalidoError
from tests.unitarios.aplicacion.dobles import (
    EscritorExcelResumenAnualFalso,
    RepositorioAjustesPrevisionFalso,
    RepositorioAsociacionesDescripcionFalso,
    RepositorioAsociacionesFalso,
    RepositorioCategoriasFalso,
    RepositorioMovimientosFalso,
    RepositorioPrevisionesFalso,
)


def _construir_exportar(escritor: EscritorExcelResumenAnualFalso) -> ExportarResumenAnualExcel:
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_ajustes = RepositorioAjustesPrevisionFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    categoria = CrearCategoria(repo_categorias).ejecutar("Suscripciones")
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    obtener_resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        repo_asociaciones,
        repo_asociaciones_descripcion,
    )
    return ExportarResumenAnualExcel(obtener_resumen, escritor)


def test_exportar_un_solo_anio_delega_un_resumen_en_el_escritor() -> None:
    escritor = EscritorExcelResumenAnualFalso()

    contenido = _construir_exportar(escritor).ejecutar(2026, 2026)

    assert contenido == b"contenido-falso"
    assert escritor.resumenes_recibidos is not None
    assert [r.anio for r in escritor.resumenes_recibidos] == [2026]
    assert len(escritor.resumenes_recibidos[0].filas_gastos) == 1


def test_exportar_un_rango_delega_un_resumen_por_anio_en_el_escritor() -> None:
    escritor = EscritorExcelResumenAnualFalso()

    _construir_exportar(escritor).ejecutar(2025, 2027)

    assert escritor.resumenes_recibidos is not None
    assert [r.anio for r in escritor.resumenes_recibidos] == [2025, 2026, 2027]


def test_anio_hasta_anterior_a_anio_desde_lanza_error() -> None:
    escritor = EscritorExcelResumenAnualFalso()

    with pytest.raises(FiltroDeListadoInvalidoError):
        _construir_exportar(escritor).ejecutar(2026, 2025)
