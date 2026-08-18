from fastapi.testclient import TestClient
from pytest_bdd import given, parsers, scenarios, then, when

scenarios("dashboard.feature")


@given(
    parsers.parse('que existen la cuenta "{numero_cuenta}" y la categoría "{nombre_categoria}"'),
    target_fixture="contexto",
)
def existen_cuenta_y_categoria(
    cliente: TestClient, numero_cuenta: str, nombre_categoria: str
) -> dict:
    cuenta = cliente.post("/api/v1/cuentas", json={"numero_cuenta": numero_cuenta}).json()
    categoria = cliente.post("/api/v1/categorias", json={"nombre": nombre_categoria}).json()
    return {"cuenta_id": cuenta["id"], "categorias": {nombre_categoria: categoria["id"]}}


@given(parsers.parse('existe la categoría "{nombre_categoria}"'))
def existe_otra_categoria(cliente: TestClient, contexto: dict, nombre_categoria: str) -> None:
    categoria = cliente.post("/api/v1/categorias", json={"nombre": nombre_categoria}).json()
    contexto["categorias"][nombre_categoria] = categoria["id"]


@given(parsers.parse('esa cuenta tiene un movimiento con importe "{importe}" y saldo "{saldo}"'))
def esa_cuenta_tiene_un_movimiento(
    cliente: TestClient, contexto: dict, importe: str, saldo: str
) -> None:
    categoria_id = next(iter(contexto["categorias"].values()))
    cliente.post(
        "/api/v1/movimientos",
        json={
            "cuenta_id": contexto["cuenta_id"],
            "categoria_id": categoria_id,
            "fecha_valor": "2026-01-01",
            "descripcion": "Movimiento de prueba",
            "importe": importe,
            "saldo": saldo,
        },
    )


@given(
    parsers.parse(
        'esa cuenta tiene un movimiento de la categoría "{nombre_categoria}" '
        'con importe "{importe}" y saldo "{saldo}"'
    )
)
def esa_cuenta_tiene_un_movimiento_de_categoria(
    cliente: TestClient, contexto: dict, nombre_categoria: str, importe: str, saldo: str
) -> None:
    cliente.post(
        "/api/v1/movimientos",
        json={
            "cuenta_id": contexto["cuenta_id"],
            "categoria_id": contexto["categorias"][nombre_categoria],
            "fecha_valor": "2026-01-02",
            "descripcion": "Movimiento de prueba",
            "importe": importe,
            "saldo": saldo,
        },
    )


@when("consulto el resumen del panel principal", target_fixture="resumen")
def consultar_resumen(cliente: TestClient) -> dict:
    return cliente.get("/api/v1/dashboard/resumen").json()


@then(parsers.parse('el saldo global es "{saldo}"'))
def el_saldo_global_es(resumen: dict, saldo: str) -> None:
    assert resumen["saldo_global"] == saldo


@then(parsers.parse('el gasto acumulado de la categoría "{nombre_categoria}" es "{total}"'))
def el_gasto_acumulado_es(resumen: dict, contexto: dict, nombre_categoria: str, total: str) -> None:
    categoria_id = contexto["categorias"][nombre_categoria]
    entrada = next(g for g in resumen["gastos_por_categoria"] if g["categoria_id"] == categoria_id)
    assert entrada["total"] == total


@then(parsers.parse('el ingreso acumulado de la categoría "{nombre_categoria}" es "{total}"'))
def el_ingreso_acumulado_es(
    resumen: dict, contexto: dict, nombre_categoria: str, total: str
) -> None:
    categoria_id = contexto["categorias"][nombre_categoria]
    entrada = next(
        i for i in resumen["ingresos_por_categoria"] if i["categoria_id"] == categoria_id
    )
    assert entrada["total"] == total
