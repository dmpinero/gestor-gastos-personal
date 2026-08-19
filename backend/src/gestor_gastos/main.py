from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from gestor_gastos.configuracion import obtener_configuracion
from gestor_gastos.infraestructura.observabilidad.registro_logs import (
    configurar_registro_logs,
)
from gestor_gastos.infraestructura.observabilidad.sentry import inicializar_sentry
from gestor_gastos.infraestructura.observabilidad.trazas import configurar_trazas
from gestor_gastos.interfaces.api.manejadores_errores import registrar_manejadores_de_errores
from gestor_gastos.interfaces.api.middleware.cabeceras_seguridad import (
    MiddlewareCabecerasSeguridad,
)
from gestor_gastos.interfaces.api.v1.enrutadores import (
    categorias,
    cuentas,
    dashboard,
    importacion,
    movimientos,
    prevision,
    salud,
)


def crear_aplicacion() -> FastAPI:
    """Factoría que construye y configura la aplicación FastAPI."""
    configuracion = obtener_configuracion()

    configurar_registro_logs()
    inicializar_sentry(configuracion)

    aplicacion = FastAPI(
        title="Gestor de Gastos Personal",
        description="API para la gestión de gastos personales.",
        version="0.1.0",
    )

    aplicacion.add_middleware(MiddlewareCabecerasSeguridad)
    registrar_manejadores_de_errores(aplicacion)

    aplicacion.include_router(salud.enrutador, prefix="/api/v1")
    aplicacion.include_router(cuentas.enrutador, prefix="/api/v1")
    aplicacion.include_router(categorias.enrutador, prefix="/api/v1")
    aplicacion.include_router(movimientos.enrutador, prefix="/api/v1")
    aplicacion.include_router(importacion.enrutador, prefix="/api/v1")
    aplicacion.include_router(dashboard.enrutador, prefix="/api/v1")
    aplicacion.include_router(prevision.enrutador, prefix="/api/v1")

    Instrumentator().instrument(aplicacion).expose(
        aplicacion, endpoint="/metricas", include_in_schema=False
    )
    configurar_trazas(aplicacion, configuracion)

    return aplicacion


app = crear_aplicacion()
