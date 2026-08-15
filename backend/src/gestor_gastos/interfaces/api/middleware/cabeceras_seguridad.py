from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Cabeceras recomendadas por el checklist de seguridad OWASP para APIs REST.
_CABECERAS_SEGURIDAD = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}


class MiddlewareCabecerasSeguridad(BaseHTTPMiddleware):
    """Añade cabeceras HTTP de seguridad a toda respuesta de la API."""

    async def dispatch(
        self, request: Request, siguiente: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        respuesta = await siguiente(request)
        for cabecera, valor in _CABECERAS_SEGURIDAD.items():
            respuesta.headers[cabecera] = valor
        return respuesta
