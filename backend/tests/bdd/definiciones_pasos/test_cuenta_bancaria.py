from fastapi.testclient import TestClient
from pytest_bdd import given, parsers, scenarios, then, when

scenarios("cuenta-bancaria.feature")


@given(
    parsers.parse('que no existe ninguna cuenta con número "{numero}"'),
    target_fixture="no_existe_cuenta",
)
def no_existe_cuenta(cliente: TestClient, numero: str) -> str:
    return numero


@given(
    parsers.parse('que ya existe una cuenta con número "{numero}"'),
    target_fixture="existe_cuenta",
)
def existe_cuenta(cliente: TestClient, numero: str) -> str:
    respuesta = cliente.post("/api/v1/cuentas", json={"numero_cuenta": numero})
    assert respuesta.status_code == 201
    return numero


@when("creo una cuenta bancaria con ese número", target_fixture="respuesta")
def crear_cuenta(cliente: TestClient, no_existe_cuenta: str):
    return cliente.post("/api/v1/cuentas", json={"numero_cuenta": no_existe_cuenta})


@when("intento crear otra cuenta con el mismo número", target_fixture="respuesta")
def crear_cuenta_duplicada(cliente: TestClient, existe_cuenta: str):
    return cliente.post("/api/v1/cuentas", json={"numero_cuenta": existe_cuenta})


@then("la cuenta aparece en el listado de cuentas")
def la_cuenta_aparece_en_el_listado(cliente: TestClient, respuesta, no_existe_cuenta: str) -> None:
    assert respuesta.status_code == 201
    listado = cliente.get("/api/v1/cuentas").json()
    assert any(c["numero_cuenta"] == no_existe_cuenta for c in listado)


@then("la API rechaza la operación con un conflicto")
def la_api_rechaza_con_conflicto(respuesta) -> None:
    assert respuesta.status_code == 409
