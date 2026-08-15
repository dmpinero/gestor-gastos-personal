import schemathesis

from gestor_gastos.main import crear_aplicacion

esquema = schemathesis.openapi.from_asgi("/openapi.json", crear_aplicacion())


@esquema.parametrize()
def test_la_api_cumple_su_contrato_openapi(case: schemathesis.Case) -> None:
    """Genera peticiones a partir del OpenAPI y valida que las respuestas cumplen el esquema."""
    case.call_and_validate()
