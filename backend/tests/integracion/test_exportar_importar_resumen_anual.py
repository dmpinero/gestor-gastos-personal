import io
from decimal import Decimal

import openpyxl

from gestor_gastos.aplicacion.prevision.ajustar_valor_mensual import AjustarValorMensual
from gestor_gastos.aplicacion.prevision.eliminar_ajuste_mensual import EliminarAjusteMensual
from gestor_gastos.aplicacion.prevision.exportar_resumen_anual_excel import (
    ExportarResumenAnualExcel,
)
from gestor_gastos.aplicacion.prevision.importar_resumen_anual_excel import (
    ImportarResumenAnualExcel,
)
from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.dominio.categoria.entidades import Categoria
from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_ajustes_prevision_sqlalchemy import (  # noqa: E501
    RepositorioAjustesPrevisionSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)
from gestor_gastos.infraestructura.prevision.escritor_excel_resumen_anual_openpyxl import (
    EscritorExcelResumenAnualOpenpyxl,
)
from gestor_gastos.infraestructura.prevision.lector_excel_resumen_anual_openpyxl import (
    LectorExcelResumenAnualOpenpyxl,
)

ANIO = 2026


def _modificar_celda(contenido: bytes, hoja: str, celda: str, valor) -> bytes:
    """Simula la edición manual del Excel exportado: abre el fichero, cambia
    el valor de una celda y lo vuelve a guardar."""
    libro = openpyxl.load_workbook(io.BytesIO(contenido))
    libro[hoja][celda] = valor
    buffer = io.BytesIO()
    libro.save(buffer)
    return buffer.getvalue()


def test_exportar_e_reimportar_sin_cambios_no_altera_nada(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_ajustes = RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )
    obtener_resumen = ObtenerResumenAnual(
        repo_previsiones, repo_categorias, repo_movimientos, repo_ajustes
    )

    contenido = ExportarResumenAnualExcel(
        obtener_resumen, EscritorExcelResumenAnualOpenpyxl()
    ).ejecutar(ANIO, ANIO)

    resultado = ImportarResumenAnualExcel(
        LectorExcelResumenAnualOpenpyxl(),
        obtener_resumen,
        AjustarValorMensual(repo_previsiones, repo_ajustes),
        EliminarAjusteMensual(repo_previsiones, repo_ajustes),
    ).ejecutar(contenido, "resumen-anual-2026.xlsx")

    assert resultado.celdas_actualizadas == 0
    assert resultado.celdas_eliminadas == 0
    assert repo_ajustes.listar_por_anio(ANIO) == []


def test_editar_una_celda_del_excel_exportado_y_reimportarlo_crea_un_ajuste(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_ajustes = RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    concepto = repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )
    obtener_resumen = ObtenerResumenAnual(
        repo_previsiones, repo_categorias, repo_movimientos, repo_ajustes
    )
    contenido = ExportarResumenAnualExcel(
        obtener_resumen, EscritorExcelResumenAnualOpenpyxl()
    ).ejecutar(ANIO, ANIO)

    # Enero es la primera columna de meses (E) de la primera fila de datos (2).
    contenido_editado = _modificar_celda(contenido, "Gastos", "E2", -60.00)

    resultado = ImportarResumenAnualExcel(
        LectorExcelResumenAnualOpenpyxl(),
        obtener_resumen,
        AjustarValorMensual(repo_previsiones, repo_ajustes),
        EliminarAjusteMensual(repo_previsiones, repo_ajustes),
    ).ejecutar(contenido_editado, "resumen-anual-2026.xlsx")

    assert resultado.celdas_actualizadas == 1
    ajustes = repo_ajustes.listar_por_anio(ANIO)
    assert len(ajustes) == 1
    assert ajustes[0].concepto_id == concepto.id
    assert ajustes[0].mes == 1
    assert ajustes[0].importe == Decimal("-60.00")

    resumen_final = obtener_resumen.ejecutar(ANIO)
    valor_enero = next(v for v in resumen_final.filas_gastos[0].valores if v.mes == 1)
    assert valor_enero.origen == "ajustado"
    assert valor_enero.importe == Decimal("-60.00")


def test_vaciar_en_excel_una_celda_ajustada_y_reimportarlo_revierte_el_ajuste(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_ajustes = RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    concepto = repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )
    obtener_resumen = ObtenerResumenAnual(
        repo_previsiones, repo_categorias, repo_movimientos, repo_ajustes
    )
    ajustar = AjustarValorMensual(repo_previsiones, repo_ajustes)
    eliminar_ajuste = EliminarAjusteMensual(repo_previsiones, repo_ajustes)
    ajustar.ejecutar(concepto.id, ANIO, 1, Decimal("-60.00"))

    contenido = ExportarResumenAnualExcel(
        obtener_resumen, EscritorExcelResumenAnualOpenpyxl()
    ).ejecutar(ANIO, ANIO)
    contenido_editado = _modificar_celda(contenido, "Gastos", "E2", None)

    resultado = ImportarResumenAnualExcel(
        LectorExcelResumenAnualOpenpyxl(), obtener_resumen, ajustar, eliminar_ajuste
    ).ejecutar(contenido_editado, "resumen-anual-2026.xlsx")

    assert resultado.celdas_eliminadas == 1
    assert repo_ajustes.listar_por_anio(ANIO) == []


def test_exportar_un_rango_de_anios_editar_celdas_de_ambos_y_reimportar_los_actualiza(
    sesion_bd,
) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_ajustes = RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    concepto = repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )
    obtener_resumen = ObtenerResumenAnual(
        repo_previsiones, repo_categorias, repo_movimientos, repo_ajustes
    )
    anio_siguiente = ANIO + 1

    contenido = ExportarResumenAnualExcel(
        obtener_resumen, EscritorExcelResumenAnualOpenpyxl()
    ).ejecutar(ANIO, anio_siguiente)

    # Fila 2 = concepto del primer año (ANIO), fila 3 = total de ANIO,
    # fila 4 = concepto del segundo año, fila 5 = total del segundo año.
    contenido_editado = _modificar_celda(contenido, "Gastos", "E2", -60.00)
    contenido_editado = _modificar_celda(contenido_editado, "Gastos", "F4", -70.00)

    resultado = ImportarResumenAnualExcel(
        LectorExcelResumenAnualOpenpyxl(),
        obtener_resumen,
        AjustarValorMensual(repo_previsiones, repo_ajustes),
        EliminarAjusteMensual(repo_previsiones, repo_ajustes),
    ).ejecutar(contenido_editado, "resumen-anual-2026-2027.xlsx")

    assert resultado.celdas_actualizadas == 2
    ajustes_primer_anio = repo_ajustes.listar_por_anio(ANIO)
    ajustes_segundo_anio = repo_ajustes.listar_por_anio(anio_siguiente)
    assert len(ajustes_primer_anio) == 1
    assert ajustes_primer_anio[0].concepto_id == concepto.id
    assert ajustes_primer_anio[0].mes == 1
    assert ajustes_primer_anio[0].importe == Decimal("-60.00")
    assert len(ajustes_segundo_anio) == 1
    assert ajustes_segundo_anio[0].mes == 2
    assert ajustes_segundo_anio[0].importe == Decimal("-70.00")
