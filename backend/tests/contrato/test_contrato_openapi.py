import schemathesis

from gestor_gastos.main import crear_aplicacion

esquema = schemathesis.openapi.from_asgi("/openapi.json", crear_aplicacion())

schemathesis.checks.load_all_checks()
_VALIDACION_ACEPTACION_POSITIVA = schemathesis.checks.CHECKS.get_by_names(
    ["positive_data_acceptance"]
)
_VALIDACION_RECHAZO_NEGATIVO = schemathesis.checks.CHECKS.get_by_names(["negative_data_rejection"])

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
    "/api/v1/previsiones/{id_concepto}/ajustes/{anio}/{mes}",
    # el fichero de importación no puede estar vacío (mismo motivo que
    # /api/v1/movimientos/importar).
    "/api/v1/previsiones/resumen-anual/importar",
    "/api/v1/previsiones/importar",
    "/api/v1/exportacion/datos/importar",
    # anio_hasta < anio_desde es válido por esquema (cada uno cumple su rango
    # individualmente) pero se rechaza por regla de negocio (FiltroDeListadoInvalidoError).
    "/api/v1/previsiones/resumen-anual/exportar",
}

# FastAPI/Starlette no rechazan un parámetro de query escalar (p.ej.
# `anio: int`) repetido en la URL (?anio=1&anio=2): toman un único valor y
# descartan el resto en silencio, sin forma de expresar en OpenAPI la
# restricción "cardinalidad 1". schemathesis, al fuzzear duplicando el
# parámetro, encuentra por azar una petición "inválida por esquema" que la
# API acepta con 200 — limitación del framework (compartida por otras rutas
# con query params escalares, p.ej. /api/v1/movimientos), no un error de
# negocio de estas rutas en concreto.
_RUTAS_SIN_VALIDACION_RECHAZO_NEGATIVO = {
    "/api/v1/previsiones/resumen-anual",
    "/api/v1/previsiones/resumen-anual/exportar",
    "/api/v1/previsiones/resumen-anual/importar",
}


@esquema.parametrize()
def test_la_api_cumple_su_contrato_openapi(case: schemathesis.Case) -> None:
    """Genera peticiones a partir del OpenAPI y valida que las respuestas cumplen el esquema."""
    excluidos = []
    if case.path in _RUTAS_SIN_VALIDACION_ACEPTACION_POSITIVA:
        excluidos.extend(_VALIDACION_ACEPTACION_POSITIVA)
    if case.path in _RUTAS_SIN_VALIDACION_RECHAZO_NEGATIVO:
        excluidos.extend(_VALIDACION_RECHAZO_NEGATIVO)
    case.call_and_validate(excluded_checks=excluidos or None)
