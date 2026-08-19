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


@given(
    parsers.parse('que existe una cuenta con número "{numero}" y un movimiento asociado'),
    target_fixture="contexto",
)
def existe_cuenta_con_movimiento(cliente: TestClient, numero: str) -> dict:
    cuenta = cliente.post("/api/v1/cuentas", json={"numero_cuenta": numero}).json()
    categoria = cliente.post("/api/v1/categorias", json={"nombre": "Alimentación"}).json()
    movimiento = cliente.post(
        "/api/v1/movimientos",
        json={
            "cuenta_id": cuenta["id"],
            "categoria_id": categoria["id"],
            "fecha_valor": "2026-01-01",
            "descripcion": "Compra",
            "importe": "-10.00",
            "saldo": "100.00",
        },
    ).json()
    return {"cuenta_id": cuenta["id"], "movimiento_id": movimiento["id"]}


@when("intento eliminar esa cuenta sin cascada", target_fixture="respuesta")
def eliminar_cuenta_sin_cascada(cliente: TestClient, contexto: dict):
    return cliente.delete(f"/api/v1/cuentas/{contexto['cuenta_id']}")


@when("elimino esa cuenta con cascada", target_fixture="respuesta")
def eliminar_cuenta_con_cascada(cliente: TestClient, contexto: dict):
    return cliente.delete(f"/api/v1/cuentas/{contexto['cuenta_id']}?cascada=true")


@then("la cuenta ya no aparece en el listado de cuentas")
def la_cuenta_ya_no_aparece(cliente: TestClient, respuesta, contexto: dict) -> None:
    assert respuesta.status_code == 204
    listado = cliente.get("/api/v1/cuentas").json()
    assert all(c["id"] != contexto["cuenta_id"] for c in listado)


@then("el movimiento asociado ya no existe")
def el_movimiento_asociado_ya_no_existe(cliente: TestClient, contexto: dict) -> None:
    listado = cliente.get(f"/api/v1/movimientos?cuenta_id={contexto['cuenta_id']}").json()
    assert all(m["id"] != contexto["movimiento_id"] for m in listado)


@then("la cuenta aparece en el listado de cuentas")
def la_cuenta_aparece_en_el_listado(cliente: TestClient, respuesta, no_existe_cuenta: str) -> None:
    assert respuesta.status_code == 201
    listado = cliente.get("/api/v1/cuentas").json()
    assert any(c["numero_cuenta"] == no_existe_cuenta for c in listado)


@then("la API rechaza la operación con un conflicto")
def la_api_rechaza_con_conflicto(respuesta) -> None:
    assert respuesta.status_code == 409
