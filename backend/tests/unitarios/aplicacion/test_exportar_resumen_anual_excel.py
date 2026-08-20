from decimal import Decimal

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.prevision.crear_concepto_previsto import CrearConceptoPrevisto
from gestor_gastos.aplicacion.prevision.exportar_resumen_anual_excel import (
    ExportarResumenAnualExcel,
)
from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from tests.unitarios.aplicacion.dobles import (
    EscritorExcelResumenAnualFalso,
    RepositorioAjustesPrevisionFalso,
    RepositorioCategoriasFalso,
    RepositorioMovimientosFalso,
    RepositorioPrevisionesFalso,
)


def test_exportar_delega_el_resumen_calculado_en_el_escritor() -> None:
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_ajustes = RepositorioAjustesPrevisionFalso()
    categoria = CrearCategoria(repo_categorias).ejecutar("Suscripciones")
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    obtener_resumen = ObtenerResumenAnual(
        repo_previsiones, repo_categorias, repo_movimientos, repo_ajustes
    )
    escritor = EscritorExcelResumenAnualFalso()

    contenido = ExportarResumenAnualExcel(obtener_resumen, escritor).ejecutar(2026)

    assert contenido == b"contenido-falso"
    assert escritor.resumen_recibido is not None
    assert escritor.resumen_recibido.anio == 2026
    assert len(escritor.resumen_recibido.filas_gastos) == 1
