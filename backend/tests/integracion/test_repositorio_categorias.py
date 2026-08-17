from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)


def test_crear_y_obtener_categoria_por_nombre(sesion_bd) -> None:
    repositorio = RepositorioCategoriasSqlAlchemy(sesion_bd)

    repositorio.crear_categoria(Categoria(nombre="Alimentación"))

    encontrada = repositorio.obtener_categoria_por_nombre("Alimentación")
    assert encontrada is not None


def test_crear_subcategoria_y_listar_por_categoria(sesion_bd) -> None:
    repositorio = RepositorioCategoriasSqlAlchemy(sesion_bd)
    categoria = repositorio.crear_categoria(Categoria(nombre="Ocio y viajes"))

    repositorio.crear_subcategoria(
        Subcategoria(nombre="Cafeterías y restaurantes", categoria_id=categoria.id)
    )

    subcategorias = repositorio.listar_subcategorias_de(categoria.id)
    assert [s.nombre for s in subcategorias] == ["Cafeterías y restaurantes"]


def test_tiene_subcategorias(sesion_bd) -> None:
    repositorio = RepositorioCategoriasSqlAlchemy(sesion_bd)
    categoria = repositorio.crear_categoria(Categoria(nombre="Ocio y viajes"))

    assert repositorio.tiene_subcategorias(categoria.id) is False

    repositorio.crear_subcategoria(Subcategoria(nombre="Hoteles", categoria_id=categoria.id))

    assert repositorio.tiene_subcategorias(categoria.id) is True


def test_actualizar_y_eliminar_categoria(sesion_bd) -> None:
    repositorio = RepositorioCategoriasSqlAlchemy(sesion_bd)
    categoria = repositorio.crear_categoria(Categoria(nombre="Ocio"))

    categoria.nombre = "Ocio y viajes"
    repositorio.actualizar_categoria(categoria)
    assert repositorio.obtener_categoria_por_id(categoria.id).nombre == "Ocio y viajes"

    repositorio.eliminar_categoria(categoria.id)
    assert repositorio.obtener_categoria_por_id(categoria.id) is None
