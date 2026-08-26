import traceback

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from gestor_gastos.dominio.excepciones import (
    EntidadConDependenciasError,
    EntidadNoEncontradaError,
    FiltroDeListadoInvalidoError,
    NombreDuplicadoError,
)
from gestor_gastos.dominio.exportacion.excepciones import (
    CabeceraExcelNoReconocidaError,
    FilaExcelInvalidaError,
    HojasExcelNoReconocidasError,
    RestauracionDeDatosFallidaError,
)
from gestor_gastos.dominio.importacion.excepciones import (
    CabeceraNoReconocidaError,
    ExtensionNoSoportadaError,
    FicheroSinMovimientosError,
)
from gestor_gastos.dominio.prevision.excepciones import (
    FicheroSinConceptosPrevistosError,
    FormatoDeIdConceptoInvalidoError,
    HojaExcelNoReconocidaError,
    ImportePrevistoInvalidoError,
    PeriodicidadNoReconocidaError,
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

    @aplicacion.exception_handler(HojaExcelNoReconocidaError)
    async def _hoja_no_reconocida(_: Request, error: HojaExcelNoReconocidaError) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(FormatoDeIdConceptoInvalidoError)
    async def _formato_id_invalido(
        _: Request, error: FormatoDeIdConceptoInvalidoError
    ) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(FicheroSinConceptosPrevistosError)
    async def _fichero_sin_conceptos_previstos(
        _: Request, error: FicheroSinConceptosPrevistosError
    ) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(PeriodicidadNoReconocidaError)
    async def _periodicidad_no_reconocida(
        _: Request, error: PeriodicidadNoReconocidaError
    ) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(ImportePrevistoInvalidoError)
    async def _importe_previsto_invalido(
        _: Request, error: ImportePrevistoInvalidoError
    ) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(HojasExcelNoReconocidasError)
    async def _hojas_no_reconocidas(
        _: Request, error: HojasExcelNoReconocidasError
    ) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(CabeceraExcelNoReconocidaError)
    async def _cabecera_excel_no_reconocida(
        _: Request, error: CabeceraExcelNoReconocidaError
    ) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(FilaExcelInvalidaError)
    async def _fila_excel_invalida(_: Request, error: FilaExcelInvalidaError) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(RestauracionDeDatosFallidaError)
    async def _restauracion_fallida(
        _: Request, error: RestauracionDeDatosFallidaError
    ) -> JSONResponse:
        return _respuesta(status.HTTP_422_UNPROCESSABLE_ENTITY, error)

    @aplicacion.exception_handler(Exception)
    async def _error_no_controlado(_: Request, error: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detalle": str(error), "traza": traceback.format_exc()},
        )
