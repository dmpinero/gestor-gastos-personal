from fastapi.testclient import TestClient
from pytest_bdd import given, parsers, scenarios, then, when

scenarios("prevision.feature")


@given(
    parsers.parse(
        'que existe la categoría "{nombre_categoria}" con un concepto previsto '
        'mensual de importe "{importe}"'
    ),
    target_fixture="contexto",
)
def existe_categoria_con_concepto_mensual(
    cliente: TestClient, nombre_categoria: str, importe: str
) -> dict:
    categoria = cliente.post("/api/v1/categorias", json={"nombre": nombre_categoria}).json()
    concepto = cliente.post(
        "/api/v1/previsiones",
        json={
            "categoria_id": categoria["id"],
            "periodicidad": "mensual",
            "importe_previsto": importe,
        },
    ).json()
    return {"categoria_id": categoria["id"], "concepto_id": concepto["id"]}


@given(
    parsers.parse(
        'existe la cuenta "{numero_cuenta}" con un movimiento en esa categoría '
        'en la fecha "{fecha}" e importe "{importe}"'
    )
)
def existe_cuenta_con_movimiento(
    cliente: TestClient, contexto: dict, numero_cuenta: str, fecha: str, importe: str
) -> None:
    cuenta = cliente.post("/api/v1/cuentas", json={"numero_cuenta": numero_cuenta}).json()
    cliente.post(
        "/api/v1/movimientos",
        json={
            "cuenta_id": cuenta["id"],
            "categoria_id": contexto["categoria_id"],
            "fecha_valor": fecha,
            "descripcion": "Movimiento de prueba",
            "importe": importe,
            "saldo": "100.00",
        },
    )


@given(parsers.parse('se ajusta manualmente el importe del mes {mes:d} de {anio:d} a "{importe}"'))
def se_ajusta_manualmente_el_importe(
    cliente: TestClient, contexto: dict, mes: int, anio: int, importe: str
) -> None:
    respuesta = cliente.put(
        f"/api/v1/previsiones/{contexto['concepto_id']}/ajustes/{anio}/{mes}",
        json={"importe": importe},
    )
    assert respuesta.status_code == 204


@when(parsers.parse("consulto el resumen anual de {anio:d}"), target_fixture="resumen")
def consulto_resumen_anual(cliente: TestClient, anio: int) -> dict:
    return cliente.get(f"/api/v1/previsiones/resumen-anual?anio={anio}").json()


@then(parsers.parse('el concepto muestra el importe real "{importe}" en el mes {mes:d}'))
def el_concepto_muestra_importe_real(resumen: dict, importe: str, mes: int) -> None:
    fila = resumen["filas_gastos"][0]
    valor = next(v for v in fila["valores"] if v["mes"] == mes)
    assert valor["importe"] == importe
    assert valor["origen"] == "real"


@then(parsers.parse('el concepto muestra el importe previsto "{importe}" en el mes {mes:d}'))
def el_concepto_muestra_importe_previsto(resumen: dict, importe: str, mes: int) -> None:
    fila = resumen["filas_gastos"][0]
    valor = next(v for v in fila["valores"] if v["mes"] == mes)
    assert valor["importe"] == importe
    assert valor["origen"] == "previsto"


@then(parsers.parse('el concepto muestra el importe ajustado "{importe}" en el mes {mes:d}'))
def el_concepto_muestra_importe_ajustado(resumen: dict, importe: str, mes: int) -> None:
    fila = resumen["filas_gastos"][0]
    valor = next(v for v in fila["valores"] if v["mes"] == mes)
    assert valor["importe"] == importe
    assert valor["origen"] == "ajustado"
