import pytest

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.categoria.crear_subcategoria import CrearSubcategoria
from gestor_gastos.aplicacion.prevision.actualizar_asociacion import ActualizarAsociacion
from gestor_gastos.aplicacion.prevision.crear_asociacion import CrearAsociacion
from gestor_gastos.aplicacion.prevision.eliminar_asociacion import EliminarAsociacion
from gestor_gastos.aplicacion.prevision.listar_asociaciones import ListarAsociaciones
from gestor_gastos.dominio.excepciones import AsociacionDuplicadaError, EntidadNoEncontradaError
from tests.unitarios.aplicacion.dobles import (
    RepositorioAsociacionesFalso,
    RepositorioCategoriasFalso,
)


def _preparar():
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_categorias = RepositorioCategoriasFalso()
    resumen = CrearCategoria(repo_categorias).ejecutar("Comida")
    movimiento = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    return repo_asociaciones, repo_categorias, resumen, movimiento


def test_crear_asociacion_a_nivel_de_categoria() -> None:
    repo_asociaciones, repo_categorias, resumen, movimiento = _preparar()

    asociacion = CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=movimiento.id,
        subcategoria_movimiento_id=None,
    )

    assert asociacion.id is not None
    assert repo_asociaciones.listar() == [asociacion]


def test_crear_asociacion_con_subcategoria_en_ambos_lados() -> None:
    repo_asociaciones, repo_categorias, resumen, movimiento = _preparar()
    sub_resumen = CrearSubcategoria(repo_categorias).ejecutar(resumen.id, "comida")
    sub_movimiento = CrearSubcategoria(repo_categorias).ejecutar(
        movimiento.id, "Supermercados y alimentación"
    )

    asociacion = CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=sub_resumen.id,
        categoria_movimiento_id=movimiento.id,
        subcategoria_movimiento_id=sub_movimiento.id,
    )

    assert asociacion.subcategoria_resumen_id == sub_resumen.id
    assert asociacion.subcategoria_movimiento_id == sub_movimiento.id


def test_crear_asociacion_con_categoria_resumen_inexistente_falla() -> None:
    repo_asociaciones, repo_categorias, _, movimiento = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
            categoria_resumen_id=999,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )


def test_crear_asociacion_con_categoria_movimiento_inexistente_falla() -> None:
    repo_asociaciones, repo_categorias, resumen, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=999,
            subcategoria_movimiento_id=None,
        )


def test_crear_asociacion_con_subcategoria_de_otra_categoria_falla() -> None:
    repo_asociaciones, repo_categorias, resumen, movimiento = _preparar()
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Otra")
    sub_de_otra = CrearSubcategoria(repo_categorias).ejecutar(otra_categoria.id, "Sub")

    with pytest.raises(EntidadNoEncontradaError):
        CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=sub_de_otra.id,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )


def test_crear_asociacion_duplicada_para_la_misma_categoria_resumen_falla() -> None:
    repo_asociaciones, repo_categorias, resumen, movimiento = _preparar()
    otra_categoria_movimiento = CrearCategoria(repo_categorias).ejecutar("Otra")
    CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=movimiento.id,
        subcategoria_movimiento_id=None,
    )

    with pytest.raises(AsociacionDuplicadaError):
        CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=otra_categoria_movimiento.id,
            subcategoria_movimiento_id=None,
        )


def test_listar_asociaciones_vacio() -> None:
    repo_asociaciones = RepositorioAsociacionesFalso()

    assert ListarAsociaciones(repo_asociaciones).ejecutar() == []


def test_eliminar_asociacion_inexistente_falla() -> None:
    repo_asociaciones = RepositorioAsociacionesFalso()

    with pytest.raises(EntidadNoEncontradaError):
        EliminarAsociacion(repo_asociaciones).ejecutar(999)


def test_eliminar_asociacion_la_borra() -> None:
    repo_asociaciones, repo_categorias, resumen, movimiento = _preparar()
    asociacion = CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=movimiento.id,
        subcategoria_movimiento_id=None,
    )

    EliminarAsociacion(repo_asociaciones).ejecutar(asociacion.id)

    assert repo_asociaciones.listar() == []


def test_actualizar_asociacion_cambia_la_categoria_movimiento() -> None:
    repo_asociaciones, repo_categorias, resumen, movimiento = _preparar()
    otra_categoria_movimiento = CrearCategoria(repo_categorias).ejecutar("Otra")
    asociacion = CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=movimiento.id,
        subcategoria_movimiento_id=None,
    )

    actualizada = ActualizarAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        asociacion.id,
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=otra_categoria_movimiento.id,
        subcategoria_movimiento_id=None,
    )

    assert actualizada.categoria_movimiento_id == otra_categoria_movimiento.id
    assert repo_asociaciones.obtener_por_id(asociacion.id).categoria_movimiento_id == (
        otra_categoria_movimiento.id
    )


def test_actualizar_asociacion_sin_cambiar_categoria_resumen_no_falla_por_duplicado_consigo_misma() -> (  # noqa: E501
    None
):
    repo_asociaciones, repo_categorias, resumen, movimiento = _preparar()
    asociacion = CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=movimiento.id,
        subcategoria_movimiento_id=None,
    )

    actualizada = ActualizarAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        asociacion.id,
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=movimiento.id,
        subcategoria_movimiento_id=None,
    )

    assert actualizada.id == asociacion.id


def test_actualizar_asociacion_a_la_categoria_resumen_de_otra_asociacion_falla() -> None:
    repo_asociaciones, repo_categorias, resumen, movimiento = _preparar()
    otra_categoria_resumen = CrearCategoria(repo_categorias).ejecutar("Otra resumen")
    otra_categoria_movimiento = CrearCategoria(repo_categorias).ejecutar("Otra movimiento")
    CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=movimiento.id,
        subcategoria_movimiento_id=None,
    )
    asociacion_a_editar = CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=otra_categoria_resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=otra_categoria_movimiento.id,
        subcategoria_movimiento_id=None,
    )

    with pytest.raises(AsociacionDuplicadaError):
        ActualizarAsociacion(repo_asociaciones, repo_categorias).ejecutar(
            asociacion_a_editar.id,
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=otra_categoria_movimiento.id,
            subcategoria_movimiento_id=None,
        )


def test_actualizar_asociacion_inexistente_falla() -> None:
    _, repo_categorias, resumen, movimiento = _preparar()
    repo_asociaciones = RepositorioAsociacionesFalso()

    with pytest.raises(EntidadNoEncontradaError):
        ActualizarAsociacion(repo_asociaciones, repo_categorias).ejecutar(
            999,
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )


def test_actualizar_asociacion_con_categoria_resumen_inexistente_falla() -> None:
    repo_asociaciones, repo_categorias, resumen, movimiento = _preparar()
    asociacion = CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=movimiento.id,
        subcategoria_movimiento_id=None,
    )

    with pytest.raises(EntidadNoEncontradaError):
        ActualizarAsociacion(repo_asociaciones, repo_categorias).ejecutar(
            asociacion.id,
            categoria_resumen_id=999,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )
