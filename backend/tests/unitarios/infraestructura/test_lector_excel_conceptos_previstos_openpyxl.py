import io
from decimal import Decimal

import openpyxl
import pytest

from gestor_gastos.dominio.importacion.excepciones import ExtensionNoSoportadaError
from gestor_gastos.dominio.prevision.excepciones import (
    FicheroSinConceptosPrevistosError,
    ImportePrevistoInvalidoError,
    PeriodicidadNoReconocidaError,
)
from gestor_gastos.infraestructura.prevision.lector_excel_conceptos_previstos_openpyxl import (
    LectorExcelConceptosPrevistosOpenpyxl,
)

_CABECERA = ["Categoría", "Subcategoría", "Periodicidad", "Importe previsto"]


def _libro(*filas: list) -> bytes:
    libro = openpyxl.Workbook()
    hoja = libro.active
    hoja.append(_CABECERA)
    for fila in filas:
        hoja.append(fila)
    buffer = io.BytesIO()
    libro.save(buffer)
    return buffer.getvalue()


def test_extension_no_soportada_lanza_error() -> None:
    with pytest.raises(ExtensionNoSoportadaError):
        LectorExcelConceptosPrevistosOpenpyxl().leer(b"contenido", "conceptos.csv")


def test_lee_correctamente_categoria_subcategoria_periodicidad_e_importe() -> None:
    contenido = _libro(["Suscripciones", "Streaming", "mensual", -9.99])

    datos = LectorExcelConceptosPrevistosOpenpyxl().leer(contenido, "conceptos.xlsx")

    assert len(datos.filas) == 1
    fila = datos.filas[0]
    assert fila.categoria == "Suscripciones"
    assert fila.subcategoria == "Streaming"
    assert fila.periodicidad == "mensual"
    assert fila.importe_previsto == Decimal("-9.99")


def test_fila_sin_subcategoria_se_lee_como_none() -> None:
    contenido = _libro(["Suscripciones", None, "mensual", -9.99])

    datos = LectorExcelConceptosPrevistosOpenpyxl().leer(contenido, "conceptos.xlsx")

    assert datos.filas[0].subcategoria is None


def test_categoria_vacia_marca_fin_de_los_datos() -> None:
    contenido = _libro(
        ["Suscripciones", "Streaming", "mensual", -9.99],
        [None, "Streaming", "mensual", -9.99],
        ["Nómina", None, "mensual", 2000.00],
    )

    datos = LectorExcelConceptosPrevistosOpenpyxl().leer(contenido, "conceptos.xlsx")

    assert len(datos.filas) == 1
    assert datos.filas[0].categoria == "Suscripciones"


def test_periodicidad_no_reconocida_lanza_error_con_numero_de_fila() -> None:
    contenido = _libro(["Suscripciones", "Streaming", "quincenal", -9.99])

    with pytest.raises(PeriodicidadNoReconocidaError, match="2"):
        LectorExcelConceptosPrevistosOpenpyxl().leer(contenido, "conceptos.xlsx")


def test_periodicidad_se_normaliza_a_minusculas() -> None:
    contenido = _libro(["Suscripciones", "Streaming", "MENSUAL", -9.99])

    datos = LectorExcelConceptosPrevistosOpenpyxl().leer(contenido, "conceptos.xlsx")

    assert datos.filas[0].periodicidad == "mensual"


def test_importe_vacio_lanza_error() -> None:
    contenido = _libro(["Suscripciones", "Streaming", "mensual", None])

    with pytest.raises(ImportePrevistoInvalidoError):
        LectorExcelConceptosPrevistosOpenpyxl().leer(contenido, "conceptos.xlsx")


def test_importe_no_numerico_lanza_error() -> None:
    contenido = _libro(["Suscripciones", "Streaming", "mensual", "no-es-un-numero"])

    with pytest.raises(ImportePrevistoInvalidoError):
        LectorExcelConceptosPrevistosOpenpyxl().leer(contenido, "conceptos.xlsx")


def test_fichero_sin_filas_de_datos_lanza_error() -> None:
    contenido = _libro()

    with pytest.raises(FicheroSinConceptosPrevistosError):
        LectorExcelConceptosPrevistosOpenpyxl().leer(contenido, "conceptos.xlsx")


def test_importe_negativo_y_positivo_se_leen_como_decimal_con_dos_decimales() -> None:
    contenido = _libro(
        ["Suscripciones", "Streaming", "mensual", -9.999],
        ["Nómina", None, "mensual", 2000.001],
    )

    datos = LectorExcelConceptosPrevistosOpenpyxl().leer(contenido, "conceptos.xlsx")

    assert datos.filas[0].importe_previsto == Decimal("-10.0")
    assert datos.filas[1].importe_previsto == Decimal("2000.0")
