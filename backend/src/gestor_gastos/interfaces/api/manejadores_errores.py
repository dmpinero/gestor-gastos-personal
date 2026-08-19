from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from gestor_gastos.dominio.excepciones import (
    EntidadConDependenciasError,
    EntidadNoEncontradaError,
    FiltroDeListadoInvalidoError,
    NombreDuplicadoError,
)
from gestor_gastos.dominio.importacion.excepciones import (
    CabeceraNoReconocidaError,
    ExtensionNoSoportadaError,
    FicheroSinMovimientosError,
)


def _respuesta(codigo: int, error: Exception) -> JSONResponse:
    return JSONResponse(status_code=codigo, content={"detalle": str(error)})


def registrar_manejadores_de_errores(aplicacion: FastAPI) -> None:
    """Traduce las excepciones de dominio a respuestas HTTP consistentes."""

    @aplicacion.exception_handler(EntidadNoEncontradaError)
    async def _no_encontrada(_: Request, error: EntidadNoEncontradaError) -> JSONResponse:
        return _respuesta(status.HTTP_404_NOT_FOUND, error)

    @aplicacion.exception_handler(NombreDuplicadoError)
    async def _nombre_duplicado(_: Request, error: NombreDuplicadoError) -> JSONResponse:
        return _respuesta(status.HTTP_409_CONFLICT, error)

    @aplicacion.exception_handler(EntidadConDependenciasError)
    async def _con_dependencias(_: Request, error: EntidadConDependenciasError) -> JSONResponse:
        return _respuesta(status.HTTP_409_CONFLICT, error)

    @aplicacion.exception_handler(FiltroDeListadoInvalidoError)
    async def _filtro_invalido(_: Request, error: FiltroDeListadoInvalidoError) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(ExtensionNoSoportadaError)
    async def _extension_no_soportada(_: Request, error: ExtensionNoSoportadaError) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(CabeceraNoReconocidaError)
    async def _cabecera_no_reconocida(_: Request, error: CabeceraNoReconocidaError) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(FicheroSinMovimientosError)
    async def _fichero_sin_movimientos(
        _: Request, error: FicheroSinMovimientosError
    ) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)
