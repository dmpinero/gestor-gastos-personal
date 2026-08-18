import datetime
from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.categoria.actualizar_categoria import ActualizarCategoria
from gestor_gastos.aplicacion.categoria.actualizar_subcategoria import ActualizarSubcategoria
from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.categoria.crear_subcategoria import CrearSubcategoria
from gestor_gastos.aplicacion.categoria.eliminar_categoria import EliminarCategoria
from gestor_gastos.aplicacion.categoria.eliminar_subcategoria import EliminarSubcategoria
from gestor_gastos.aplicacion.categoria.listar_categorias import ListarCategorias
from gestor_gastos.dominio.excepciones import (
    EntidadConDependenciasError,
    EntidadNoEncontradaError,
    NombreDuplicadoError,
)
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from tests.unitarios.aplicacion.dobles import (
    RepositorioCategoriasFalso,
    RepositorioMovimientosFalso,
)


def test_crear_categoria_la_guarda() -> None:
    repo = RepositorioCategoriasFalso()

    categoria = CrearCategoria(repo).ejecutar("Alimentación")

    assert categoria.id is not None
    assert repo.obtener_categoria_por_nombre("Alimentación") == categoria


def test_crear_categoria_con_nombre_duplicado_falla() -> None:
    repo = RepositorioCategoriasFalso()
    CrearCategoria(repo).ejecutar("Alimentación")

    with pytest.raises(NombreDuplicadoError):
        CrearCategoria(repo).ejecutar("Alimentación")


def test_actualizar_categoria_renombra() -> None:
    repo = RepositorioCategoriasFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio")

    actualizada = ActualizarCategoria(repo).ejecutar(categoria.id, "Ocio y viajes")

    assert actualizada.nombre == "Ocio y viajes"


def test_actualizar_categoria_con_su_propio_nombre_no_falla() -> None:
    repo = RepositorioCategoriasFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio")

    actualizada = ActualizarCategoria(repo).ejecutar(categoria.id, "Ocio")

    assert actualizada.nombre == "Ocio"


def test_actualizar_categoria_con_nombre_de_otra_categoria_falla() -> None:
    repo = RepositorioCategoriasFalso()
    CrearCategoria(repo).ejecutar("Ocio")
    hogar = CrearCategoria(repo).ejecutar("Hogar")

    with pytest.raises(NombreDuplicadoError):
        ActualizarCategoria(repo).ejecutar(hogar.id, "Ocio")


def test_eliminar_categoria_con_subcategorias_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    CrearSubcategoria(repo).ejecutar(categoria.id, "Cafeterías y restaurantes")

    with pytest.raises(EntidadConDependenciasError):
        EliminarCategoria(repo, repo_movimientos).ejecutar(categoria.id)


def test_eliminar_categoria_sin_dependencias_la_borra() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    categoria = CrearCategoria(repo).ejecutar("Hogar")

    EliminarCategoria(repo, repo_movimientos).ejecutar(categoria.id)

    assert repo.obtener_categoria_por_id(categoria.id) is None


def test_crear_subcategoria_bajo_categoria_inexistente_falla() -> None:
    repo = RepositorioCategoriasFalso()

    with pytest.raises(EntidadNoEncontradaError):
        CrearSubcategoria(repo).ejecutar(999, "Cafeterías")


def test_crear_subcategoria_con_nombre_duplicado_en_misma_categoria_falla() -> None:
    repo = RepositorioCategoriasFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    CrearSubcategoria(repo).ejecutar(categoria.id, "Hotel y alojamiento")

    with pytest.raises(NombreDuplicadoError):
        CrearSubcategoria(repo).ejecutar(categoria.id, "Hotel y alojamiento")


def test_mismo_nombre_de_subcategoria_en_categorias_distintas_permitido() -> None:
    repo = RepositorioCategoriasFalso()
    compras = CrearCategoria(repo).ejecutar("Compras")
    hogar = CrearCategoria(repo).ejecutar("Hogar")
    CrearSubcategoria(repo).ejecutar(compras.id, "Otros")

    otra = CrearSubcategoria(repo).ejecutar(hogar.id, "Otros")

    assert otra.categoria_id == hogar.id


def test_actualizar_subcategoria_renombra() -> None:
    repo = RepositorioCategoriasFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Cafes")

    actualizada = ActualizarSubcategoria(repo).ejecutar(
        subcategoria.id, "Cafeterías y restaurantes"
    )

    assert actualizada.nombre == "Cafeterías y restaurantes"


def test_actualizar_subcategoria_con_su_propio_nombre_no_falla() -> None:
    repo = RepositorioCategoriasFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Cafes")

    actualizada = ActualizarSubcategoria(repo).ejecutar(subcategoria.id, "Cafes")

    assert actualizada.nombre == "Cafes"


def test_actualizar_subcategoria_con_nombre_de_otra_de_la_misma_categoria_falla() -> None:
    repo = RepositorioCategoriasFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    CrearSubcategoria(repo).ejecutar(categoria.id, "Cafes")
    hoteles = CrearSubcategoria(repo).ejecutar(categoria.id, "Hoteles")

    with pytest.raises(NombreDuplicadoError):
        ActualizarSubcategoria(repo).ejecutar(hoteles.id, "Cafes")


def test_actualizar_subcategoria_con_nombre_de_otra_categoria_no_falla() -> None:
    repo = RepositorioCategoriasFalso()
    compras = CrearCategoria(repo).ejecutar("Compras")
    hogar = CrearCategoria(repo).ejecutar("Hogar")
    CrearSubcategoria(repo).ejecutar(compras.id, "Otros")
    de_hogar = CrearSubcategoria(repo).ejecutar(hogar.id, "Varios")

    actualizada = ActualizarSubcategoria(repo).ejecutar(de_hogar.id, "Otros")

    assert actualizada.nombre == "Otros"


def test_eliminar_subcategoria_con_movimientos_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Cafeterías y restaurantes")
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=1,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Café",
            importe=Decimal("-3.50"),
            saldo=Decimal("100.00"),
        )
    )

    with pytest.raises(EntidadConDependenciasError):
        EliminarSubcategoria(repo, repo_movimientos).ejecutar(subcategoria.id)


def test_listar_categorias_con_subcategorias() -> None:
    repo = RepositorioCategoriasFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    CrearSubcategoria(repo).ejecutar(categoria.id, "Cafeterías y restaurantes")

    resultado = ListarCategorias(repo).ejecutar()

    assert len(resultado) == 1
    assert resultado[0].categoria.nombre == "Ocio y viajes"
    assert [s.nombre for s in resultado[0].subcategorias] == ["Cafeterías y restaurantes"]


def test_listar_categorias_sin_subcategorias_devuelve_lista_vacia() -> None:
    repo = RepositorioCategoriasFalso()
    CrearCategoria(repo).ejecutar("Otros ingresos")

    resultado = ListarCategorias(repo).ejecutar()

    assert resultado[0].subcategorias == []
