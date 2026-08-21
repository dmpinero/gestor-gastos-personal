from fastapi import FastAPI
from fastapi.testclient import TestClient

from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.interfaces.api.manejadores_errores import registrar_manejadores_de_errores


def _construir_app_de_pruebas() -> FastAPI:
    aplicacion = FastAPI()
    registrar_manejadores_de_errores(aplicacion)

    @aplicacion.get("/controlado")
    def _controlado() -> None:
        raise EntidadNoEncontradaError("cuenta no encontrada")

    @aplicacion.get("/no-controlado")
    def _no_controlado() -> None:
        raise ValueError("boom inesperado")

    return aplicacion


cliente = TestClient(_construir_app_de_pruebas(), raise_server_exceptions=False)


def test_un_error_no_controlado_devuelve_500_con_traza_completa() -> None:
    respuesta = cliente.get("/no-controlado")

    assert respuesta.status_code == 500
    cuerpo = respuesta.json()
    assert cuerpo["detalle"] == "boom inesperado"
    assert "Traceback" in cuerpo["traza"]
    assert "ValueError" in cuerpo["traza"]


def test_un_error_de_dominio_ya_mapeado_no_incluye_traza() -> None:
    respuesta = cliente.get("/controlado")

    assert respuesta.status_code == 404
    cuerpo = respuesta.json()
    assert cuerpo["detalle"] == "cuenta no encontrada"
    assert "traza" not in cuerpo
