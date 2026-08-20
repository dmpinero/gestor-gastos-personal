import io

import openpyxl

from gestor_gastos.aplicacion.prevision.importar_conceptos_previstos_excel import (
    ImportarConceptosPrevistosExcel,
)
from gestor_gastos.dominio.categoria.entidades import Categoria
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)
from gestor_gastos.infraestructura.prevision.lector_excel_conceptos_previstos_openpyxl import (
    LectorExcelConceptosPrevistosOpenpyxl,
)


def _excel_conceptos_previstos(*filas: list) -> bytes:
    libro = openpyxl.Workbook()
    hoja = libro.active
    hoja.append(["Categoría", "Subcategoría", "Periodicidad", "Importe previsto"])
    for fila in filas:
        hoja.append(fila)
    buffer = io.BytesIO()
    libro.save(buffer)
    return buffer.getvalue()


def test_importa_crea_categoria_subcategoria_y_concepto_en_bd(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    contenido = _excel_conceptos_previstos(["Suscripciones", "Streaming", "mensual", -9.99])

    resumen = ImportarConceptosPrevistosExcel(
        repo_categorias, repo_previsiones, LectorExcelConceptosPrevistosOpenpyxl()
    ).ejecutar(contenido, "conceptos.xlsx")

    assert resumen.conceptos_creados == 1
    categoria = repo_categorias.obtener_categoria_por_nombre("Suscripciones")
    assert categoria is not None
    subcategoria = repo_categorias.obtener_subcategoria_por_nombre(categoria.id, "Streaming")
    assert subcategoria is not None
    conceptos = repo_previsiones.listar()
    assert len(conceptos) == 1
    assert conceptos[0].categoria_id == categoria.id
    assert conceptos[0].subcategoria_id == subcategoria.id


def test_reimportar_el_mismo_fichero_omite_el_concepto_duplicado(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    contenido = _excel_conceptos_previstos(["Suscripciones", "Streaming", "mensual", -9.99])
    caso_de_uso = ImportarConceptosPrevistosExcel(
        repo_categorias, repo_previsiones, LectorExcelConceptosPrevistosOpenpyxl()
    )
    caso_de_uso.ejecutar(contenido, "conceptos.xlsx")

    resumen = caso_de_uso.ejecutar(contenido, "conceptos.xlsx")

    assert resumen.conceptos_creados == 0
    assert resumen.conceptos_omitidos_por_duplicado == 1
    assert len(repo_previsiones.listar()) == 1


def test_importa_reutiliza_categoria_ya_creada_por_otro_medio(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    categoria_existente = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    contenido = _excel_conceptos_previstos(["Suscripciones", "Streaming", "mensual", -9.99])

    resumen = ImportarConceptosPrevistosExcel(
        repo_categorias, repo_previsiones, LectorExcelConceptosPrevistosOpenpyxl()
    ).ejecutar(contenido, "conceptos.xlsx")

    assert resumen.categorias_creadas == []
    assert len(repo_categorias.listar_categorias()) == 1
    assert repo_categorias.listar_categorias()[0].id == categoria_existente.id
