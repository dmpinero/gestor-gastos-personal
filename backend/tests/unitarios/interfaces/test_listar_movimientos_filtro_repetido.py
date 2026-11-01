import pytest
from fastapi.testclient import TestClient

from gestor_gastos.infraestructura.persistencia.sesion import obtener_sesion
from gestor_gastos.main import crear_aplicacion

aplicacion = crear_aplicacion()
aplicacion.dependency_overrides[obtener_sesion] = lambda: iter([None])
cliente = TestClient(aplicacion)


@pytest.mark.parametrize("nombre_filtro", ["cuenta_id", "categoria_id", "subcategoria_id"])
def test_repetir_un_filtro_escalar_se_rechaza_con_422(nombre_filtro: str) -> None:
    # Regresión del bug de contrato #33: FastAPI/Starlette no rechazan por sí
    # solos un query param escalar repetido (toman un único valor en
    # silencio), violando la cardinalidad 1 declarada en el esquema OpenAPI.
    respuesta = cliente.get(f"/api/v1/movimientos?{nombre_filtro}=1&{nombre_filtro}=2")

    assert respuesta.status_code == 422
    assert nombre_filtro in respuesta.json()["detalle"]
