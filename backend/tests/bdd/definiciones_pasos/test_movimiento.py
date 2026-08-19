from fastapi.testclient import TestClient
from pytest_bdd import given, parsers, scenarios, then, when

scenarios("movimiento.feature")


@given(
    parsers.parse('que existen la cuenta "{numero_cuenta}" y la categoría "{nombre_categoria}"'),
    target_fixture="contexto",
)
def existen_cuenta_y_categoria(
    cliente: TestClient, numero_cuenta: str, nombre_categoria: str
) -> dict:
    cuenta = cliente.post("/api/v1/cuentas", json={"numero_cuenta": numero_cuenta}).json()
    categoria = cliente.post("/api/v1/categorias", json={"nombre": nombre_categoria}).json()
    return {"cuenta_id": cuenta["id"], "categoria_id": categoria["id"]}


@given(parsers.parse('esa cuenta tiene un movimiento en la fecha "{fecha}"'))
def esa_cuenta_tiene_un_movimiento(cliente: TestClient, contexto: dict, fecha: str) -> None:
    cliente.post(
        "/api/v1/movimientos",
        json={
            "cuenta_id": contexto["cuenta_id"],
            "categoria_id": contexto["categoria_id"],
            "fecha_valor": fecha,
            "descripcion": f"Movimiento del {fecha}",
            "importe": "-1.00",
            "saldo": "100.00",
        },
    )


@when(
    parsers.parse('creo un movimiento en esa cuenta con importe "{importe}" y saldo "{saldo}"'),
    target_fixture="respuesta",
)
def crear_movimiento(cliente: TestClient, contexto: dict, importe: str, saldo: str):
    return cliente.post(
        "/api/v1/movimientos",
        json={
            "cuenta_id": contexto["cuenta_id"],
            "categoria_id": contexto["categoria_id"],
            "fecha_valor": "2026-01-01",
            "descripcion": "Movimiento de prueba",
            "importe": importe,
            "saldo": saldo,
        },
    )


@when("consulto el listado de movimientos de esa cuenta", target_fixture="listado")
def listar_movimientos(cliente: TestClient, contexto: dict) -> list:
    return cliente.get(f"/api/v1/movimientos?cuenta_id={contexto['cuenta_id']}").json()


@then("el movimiento aparece en el listado de movimientos de esa cuenta")
def el_movimiento_aparece(cliente: TestClient, respuesta, contexto: dict) -> None:
    assert respuesta.status_code == 201
    listado = cliente.get(f"/api/v1/movimientos?cuenta_id={contexto['cuenta_id']}").json()
    assert any(m["id"] == respuesta.json()["id"] for m in listado)


@then(parsers.parse('el primero de la lista es el de la fecha "{fecha}"'))
def el_primero_es_de_la_fecha(listado: list, fecha: str) -> None:
    assert listado[0]["fecha_valor"] == fecha


@when("consulto el listado de movimientos de esa categoría", target_fixture="listado")
def listar_movimientos_por_categoria(cliente: TestClient, contexto: dict) -> list:
    return cliente.get(f"/api/v1/movimientos?categoria_id={contexto['categoria_id']}").json()


@then("el movimiento aparece en el listado")
def el_movimiento_aparece_en_el_listado(listado: list) -> None:
    assert len(listado) == 1
