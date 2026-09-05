import datetime
from decimal import Decimal
from pathlib import Path

import pytest

from gestor_gastos.dominio.importacion.excepciones import (
    CabeceraNoReconocidaError,
    ExtensionNoSoportadaError,
    FicheroSinMovimientosError,
)
from gestor_gastos.infraestructura.importacion.lector_pdf_ing import LectorPdfIng

RUTA_FIXTURES = Path(__file__).parent.parent.parent / "fixtures"
RUTA_FIXTURE = RUTA_FIXTURES / "movimientos_ejemplo.pdf"


def _leer_fixture():
    contenido = RUTA_FIXTURE.read_bytes()
    return LectorPdfIng().leer(contenido, "movimientos_ejemplo.pdf")


def test_extrae_numero_de_cuenta_y_titular_de_la_cabecera() -> None:
    datos = _leer_fixture()

    assert datos.cabecera.numero_cuenta == "9999 8888 77 6655443322"
    assert datos.cabecera.titular == "PERSONA PDF EJEMPLO"


def test_extrae_todas_las_filas_de_movimientos() -> None:
    datos = _leer_fixture()

    assert len(datos.filas) == 3


def test_primera_fila_tiene_los_datos_esperados() -> None:
    datos = _leer_fixture()

    primera = datos.filas[0]
    assert primera.fecha_valor == datetime.date(2026, 1, 10)
    assert primera.descripcion == "Pago en Amazon Prime*ABC123"
    assert primera.importe == Decimal("-25.40")
    assert primera.saldo == Decimal("974.60")


def test_fila_con_importe_positivo_se_lee_igual() -> None:
    datos = _leer_fixture()

    ingreso = next(f for f in datos.filas if f.importe > 0)
    assert ingreso.descripcion == "Nomina recibida EMPRESA EJEMPLO SL"
    assert ingreso.importe == Decimal("1000.00")


def test_extension_no_soportada_lanza_error() -> None:
    with pytest.raises(ExtensionNoSoportadaError):
        LectorPdfIng().leer(b"contenido", "movimientos.csv")


def test_fichero_sin_cabecera_reconocible_lanza_error() -> None:
    contenido = (RUTA_FIXTURES / "movimientos_ejemplo_sin_cabecera.pdf").read_bytes()

    with pytest.raises(CabeceraNoReconocidaError):
        LectorPdfIng().leer(contenido, "sin_cabecera.pdf")


def test_fichero_sin_filas_de_movimientos_lanza_error() -> None:
    contenido = (RUTA_FIXTURES / "movimientos_ejemplo_sin_filas.pdf").read_bytes()

    with pytest.raises(FicheroSinMovimientosError):
        LectorPdfIng().leer(contenido, "sin_filas.pdf")
