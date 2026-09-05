import datetime

from fastapi.testclient import TestClient

from gestor_gastos.main import crear_aplicacion

cliente = TestClient(crear_aplicacion())

_ANIO_ACTUAL = datetime.date.today().year


def test_rechaza_un_anio_desde_anterior_a_2018() -> None:
    respuesta = cliente.get(
        "/api/v1/previsiones/resumen-anual/exportar?anio_desde=2017&anio_hasta=2020"
    )

    assert respuesta.status_code == 422


def test_rechaza_un_anio_hasta_posterior_al_siguiente_al_actual() -> None:
    respuesta = cliente.get(
        f"/api/v1/previsiones/resumen-anual/exportar?anio_desde=2020&anio_hasta={_ANIO_ACTUAL + 2}"
    )

    assert respuesta.status_code == 422


def test_admite_el_rango_completo_permitido() -> None:
    # Regresión del rendimiento: antes de acotar el rango, un anio_desde/
    # anio_hasta amplio (p.ej. 1-9999) hacía que ExportarResumenAnualExcel
    # iterase un año por cada valor del rango, tardando minutos.
    respuesta = cliente.get(
        f"/api/v1/previsiones/resumen-anual/exportar?anio_desde=2018&anio_hasta={_ANIO_ACTUAL + 1}"
    )

    assert respuesta.status_code == 200
