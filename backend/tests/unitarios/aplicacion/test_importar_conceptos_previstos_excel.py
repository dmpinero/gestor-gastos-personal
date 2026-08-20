from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.prevision.importar_conceptos_previstos_excel import (
    ImportarConceptosPrevistosExcel,
)
from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto
from gestor_gastos.dominio.prevision.excepciones import PeriodicidadNoReconocidaError
from gestor_gastos.dominio.prevision.valores import (
    DatosConceptosPrevistosExcelLeidos,
    FilaConceptoPrevistoExcel,
)
from tests.unitarios.aplicacion.dobles import (
    LectorExcelConceptosPrevistosFalso,
    RepositorioCategoriasFalso,
    RepositorioPrevisionesFalso,
)


def _fila(
    categoria="Suscripciones",
    subcategoria="Streaming",
    periodicidad="mensual",
    importe="-9.99",
):
    return FilaConceptoPrevistoExcel(
        categoria=categoria,
        subcategoria=subcategoria,
        periodicidad=periodicidad,
        importe_previsto=Decimal(importe),
    )


def _construir_caso_de_uso(lector):
    repo_categorias = RepositorioCategoriasFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    caso_de_uso = ImportarConceptosPrevistosExcel(repo_categorias, repo_previsiones, lector)
    return caso_de_uso, repo_categorias, repo_previsiones


def test_importa_crea_categoria_y_subcategoria_nuevas_y_el_concepto() -> None:
    datos = DatosConceptosPrevistosExcelLeidos(filas=[_fila()])
    caso_de_uso, repo_categorias, repo_previsiones = _construir_caso_de_uso(
        LectorExcelConceptosPrevistosFalso(datos=datos)
    )

    resumen = caso_de_uso.ejecutar(b"contenido", "conceptos.xlsx")

    assert resumen.conceptos_creados == 1
    assert resumen.conceptos_omitidos_por_duplicado == 0
    assert resumen.categorias_creadas == ["Suscripciones"]
    assert resumen.subcategorias_creadas == ["Streaming"]
    categoria = repo_categorias.obtener_categoria_por_nombre("Suscripciones")
    assert categoria is not None
    conceptos = repo_previsiones.listar()
    assert len(conceptos) == 1
    assert conceptos[0].categoria_id == categoria.id
    assert conceptos[0].periodicidad == "mensual"
    assert conceptos[0].importe_previsto == Decimal("-9.99")


def test_importa_reutiliza_categoria_existente_y_crea_subcategoria_nueva() -> None:
    repo_categorias = RepositorioCategoriasFalso()
    categoria_existente = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    datos = DatosConceptosPrevistosExcelLeidos(filas=[_fila()])
    caso_de_uso = ImportarConceptosPrevistosExcel(
        repo_categorias,
        RepositorioPrevisionesFalso(),
        LectorExcelConceptosPrevistosFalso(datos=datos),
    )

    resumen = caso_de_uso.ejecutar(b"contenido", "conceptos.xlsx")

    assert resumen.categorias_creadas == []
    assert resumen.subcategorias_creadas == ["Streaming"]
    assert len(repo_categorias.listar_categorias()) == 1
    assert (
        repo_categorias.obtener_categoria_por_nombre("Suscripciones").id == categoria_existente.id
    )


def test_importa_reutiliza_categoria_y_subcategoria_existentes() -> None:
    repo_categorias = RepositorioCategoriasFalso()
    categoria_existente = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    repo_categorias.crear_subcategoria(
        Subcategoria(nombre="Streaming", categoria_id=categoria_existente.id)
    )
    datos = DatosConceptosPrevistosExcelLeidos(filas=[_fila()])
    caso_de_uso = ImportarConceptosPrevistosExcel(
        repo_categorias,
        RepositorioPrevisionesFalso(),
        LectorExcelConceptosPrevistosFalso(datos=datos),
    )

    resumen = caso_de_uso.ejecutar(b"contenido", "conceptos.xlsx")

    assert resumen.categorias_creadas == []
    assert resumen.subcategorias_creadas == []
    assert resumen.conceptos_creados == 1


def test_importa_omite_concepto_ya_existente_con_misma_categoria_y_subcategoria() -> None:
    repo_categorias = RepositorioCategoriasFalso()
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    subcategoria = repo_categorias.crear_subcategoria(
        Subcategoria(nombre="Streaming", categoria_id=categoria.id)
    )
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            periodicidad="mensual",
            importe_previsto=Decimal("-5.00"),
        )
    )
    datos = DatosConceptosPrevistosExcelLeidos(filas=[_fila()])
    caso_de_uso = ImportarConceptosPrevistosExcel(
        repo_categorias, repo_previsiones, LectorExcelConceptosPrevistosFalso(datos=datos)
    )

    resumen = caso_de_uso.ejecutar(b"contenido", "conceptos.xlsx")

    assert resumen.conceptos_creados == 0
    assert resumen.conceptos_omitidos_por_duplicado == 1
    assert len(repo_previsiones.listar()) == 1


def test_fila_sin_subcategoria_crea_concepto_con_subcategoria_id_none() -> None:
    datos = DatosConceptosPrevistosExcelLeidos(
        filas=[
            _fila(subcategoria=None, categoria="Nómina", periodicidad="mensual", importe="2000.00")
        ]
    )
    caso_de_uso, _, repo_previsiones = _construir_caso_de_uso(
        LectorExcelConceptosPrevistosFalso(datos=datos)
    )

    resumen = caso_de_uso.ejecutar(b"contenido", "conceptos.xlsx")

    assert resumen.conceptos_creados == 1
    assert repo_previsiones.listar()[0].subcategoria_id is None


def test_mes_inicio_del_concepto_creado_es_none() -> None:
    datos = DatosConceptosPrevistosExcelLeidos(filas=[_fila(periodicidad="trimestral")])
    caso_de_uso, _, repo_previsiones = _construir_caso_de_uso(
        LectorExcelConceptosPrevistosFalso(datos=datos)
    )

    caso_de_uso.ejecutar(b"contenido", "conceptos.xlsx")

    assert repo_previsiones.listar()[0].mes_inicio is None


def test_dos_filas_del_mismo_fichero_con_igual_categoria_y_subcategoria_la_segunda_se_omite() -> (
    None
):
    datos = DatosConceptosPrevistosExcelLeidos(filas=[_fila(), _fila()])
    caso_de_uso, _, repo_previsiones = _construir_caso_de_uso(
        LectorExcelConceptosPrevistosFalso(datos=datos)
    )

    resumen = caso_de_uso.ejecutar(b"contenido", "conceptos.xlsx")

    assert resumen.conceptos_creados == 1
    assert resumen.conceptos_omitidos_por_duplicado == 1
    assert len(repo_previsiones.listar()) == 1


def test_error_del_lector_se_propaga() -> None:
    caso_de_uso, _, _ = _construir_caso_de_uso(
        LectorExcelConceptosPrevistosFalso(
            error=PeriodicidadNoReconocidaError("periodicidad no reconocida en la fila 2")
        )
    )

    with pytest.raises(PeriodicidadNoReconocidaError):
        caso_de_uso.ejecutar(b"contenido", "conceptos.xlsx")
