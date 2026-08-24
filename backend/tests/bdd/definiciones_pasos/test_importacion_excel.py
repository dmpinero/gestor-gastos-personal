import json
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from pytest_bdd import given, scenarios, then, when

scenarios("importacion-excel.feature")

RUTA_FIXTURE = Path(__file__).parent.parent.parent / "fixtures" / "movimientos_ejemplo.xlsx"


def _resumen_final(respuesta) -> dict[str, Any]:
    """La importación devuelve NDJSON: una línea de progreso por fila y, al
    final, una línea {"tipo": "resumen", ...} con el resultado completo."""
    lineas = [linea for linea in respuesta.text.strip().split("\n") if linea]
    eventos = [json.loads(linea) for linea in lineas]
    return next(evento for evento in reversed(eventos) if evento["tipo"] == "resumen")


def _contenido_fichero_valido() -> tuple[str, bytes, str]:
    return (
        "movimientos_ejemplo.xlsx",
        RUTA_FIXTURE.read_bytes(),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@given("un fichero Excel de movimientos válido", target_fixture="fichero")
def fichero_valido() -> tuple[str, bytes, str]:
    return _contenido_fichero_valido()


@given("un fichero Excel de movimientos válido ya importado previamente", target_fixture="fichero")
def fichero_ya_importado(cliente: TestClient) -> tuple[str, bytes, str]:
    contenido = _contenido_fichero_valido()
    cliente.post("/api/v1/movimientos/importar", files={"fichero": contenido})
    return _contenido_fichero_valido()


@given('un fichero con extensión ".csv"', target_fixture="fichero")
def fichero_csv() -> tuple[str, bytes, str]:
    return ("movimientos.csv", b"fecha,importe\n2026-01-01,-10", "text/csv")


@when("lo importo", target_fixture="respuesta")
@when("lo importo de nuevo", target_fixture="respuesta")
def importar(cliente: TestClient, fichero: tuple[str, bytes, str]):
    return cliente.post("/api/v1/movimientos/importar", files={"fichero": fichero})


@then("el resumen indica que se importaron 5 movimientos")
def resumen_importados(respuesta) -> None:
    assert respuesta.status_code == 200
    assert _resumen_final(respuesta)["movimientos_importados"] == 5


@then("el resumen indica que se omitieron 5 movimientos por duplicado")
def resumen_omitidos(respuesta) -> None:
    assert respuesta.status_code == 200
    resumen = _resumen_final(respuesta)
    assert resumen["movimientos_omitidos_por_duplicado"] == 5
    assert len(resumen["duplicados"]) == 5


@then("se ha creado la cuenta del fichero")
def se_ha_creado_la_cuenta(cliente: TestClient) -> None:
    listado = cliente.get("/api/v1/cuentas").json()
    assert any(c["numero_cuenta"] == "1234 5678 9012 34567890" for c in listado)


@then("la API rechaza el fichero con un error de validación")
def la_api_rechaza_el_fichero(respuesta) -> None:
    assert respuesta.status_code == 422
