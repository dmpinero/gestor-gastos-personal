from fastapi.testclient import TestClient
from pytest_bdd import given, parsers, scenarios, then, when

scenarios("categoria.feature")


@given(
    parsers.parse('que no existe la categoría "{nombre}"'),
    target_fixture="no_existe_categoria",
)
def no_existe_categoria(cliente: TestClient, nombre: str) -> str:
    return nombre


@given(parsers.parse('que existe la categoría "{nombre}"'), target_fixture="id_categoria")
def existe_categoria(cliente: TestClient, nombre: str) -> int:
    respuesta = cliente.post("/api/v1/categorias", json={"nombre": nombre})
    assert respuesta.status_code == 201
    return respuesta.json()["id"]


@when(parsers.parse('creo una categoría con nombre "{nombre}"'), target_fixture="respuesta")
def crear_categoria(cliente: TestClient, nombre: str):
    return cliente.post("/api/v1/categorias", json={"nombre": nombre})


@when(
    parsers.parse('creo la subcategoría "{nombre}" en esa categoría'),
    target_fixture="respuesta",
)
def crear_subcategoria(cliente: TestClient, id_categoria: int, nombre: str):
    return cliente.post(f"/api/v1/categorias/{id_categoria}/subcategorias", json={"nombre": nombre})


@then("la categoría aparece en el listado de categorías")
def la_categoria_aparece(cliente: TestClient, respuesta, no_existe_categoria: str) -> None:
    assert respuesta.status_code == 201
    listado = cliente.get("/api/v1/categorias").json()
    assert any(item["categoria"]["nombre"] == no_existe_categoria for item in listado)


@then(parsers.parse('la subcategoría aparece bajo "{nombre_categoria}" en el listado jerárquico'))
def la_subcategoria_aparece(cliente: TestClient, respuesta, nombre_categoria: str) -> None:
    assert respuesta.status_code == 201
    nombre_subcategoria = respuesta.json()["nombre"]
    listado = cliente.get("/api/v1/categorias").json()
    item = next(i for i in listado if i["categoria"]["nombre"] == nombre_categoria)
    assert any(s["nombre"] == nombre_subcategoria for s in item["subcategorias"])
