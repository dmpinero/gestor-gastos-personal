import schemathesis

from gestor_gastos.main import crear_aplicacion

esquema = schemathesis.openapi.from_asgi("/openapi.json", crear_aplicacion())

schemathesis.checks.load_all_checks()
_VALIDACION_ACEPTACION_POSITIVA = schemathesis.checks.CHECKS.get_by_names(
    ["positive_data_acceptance"]
)

# Casos donde OpenAPI/JSON Schema no puede expresar una restricción de negocio
# que sí validamos en Pydantic, así que schemathesis genera datos "válidos por
# esquema" que nuestra API rechaza legítimamente con 422:
# - la subida de fichero no puede estar vacía (no hay forma de expresarlo en
#   el esquema de un campo binario);
# - importe/saldo son Decimal(12, 2): un float en notación científica con
#   muchos dígitos significativos es un "number" válido por esquema pero no
#   cumple la precisión de negocio.
_RUTAS_SIN_VALIDACION_ACEPTACION_POSITIVA = {
    "/api/v1/movimientos/importar",
    "/api/v1/movimientos",
    "/api/v1/movimientos/{id_movimiento}",
    # importe_previsto es igualmente un Decimal(12, 2): mismo motivo que arriba.
    "/api/v1/previsiones",
    "/api/v1/previsiones/{id_concepto}",
}


@esquema.parametrize()
def test_la_api_cumple_su_contrato_openapi(case: schemathesis.Case) -> None:
    """Genera peticiones a partir del OpenAPI y valida que las respuestas cumplen el esquema."""
    excluidos = (
        _VALIDACION_ACEPTACION_POSITIVA
        if case.path in _RUTAS_SIN_VALIDACION_ACEPTACION_POSITIVA
        else None
    )
    case.call_and_validate(excluded_checks=excluidos)
