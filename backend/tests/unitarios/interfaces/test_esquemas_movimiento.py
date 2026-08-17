import datetime
from decimal import Decimal

import pytest
from pydantic import ValidationError

from gestor_gastos.interfaces.api.v1.esquemas.movimiento import MovimientoCrearEsquema


def _datos_validos() -> dict:
    return {
        "cuenta_id": 1,
        "categoria_id": 1,
        "fecha_valor": datetime.date(2026, 1, 1),
        "descripcion": "Compra",
        "importe": Decimal("-10.00"),
        "saldo": Decimal("100.00"),
    }


def test_esquema_valido_no_lanza_error() -> None:
    MovimientoCrearEsquema(**_datos_validos())


def test_falta_descripcion_lanza_error_de_validacion() -> None:
    datos = _datos_validos()
    del datos["descripcion"]

    with pytest.raises(ValidationError):
        MovimientoCrearEsquema(**datos)


def test_descripcion_vacia_lanza_error_de_validacion() -> None:
    datos = _datos_validos()
    datos["descripcion"] = ""

    with pytest.raises(ValidationError):
        MovimientoCrearEsquema(**datos)
