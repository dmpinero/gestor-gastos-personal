import pytest

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.categoria.crear_subcategoria import CrearSubcategoria
from gestor_gastos.aplicacion.prevision.actualizar_asociacion_descripcion import (
    ActualizarAsociacionDescripcion,
)
from gestor_gastos.aplicacion.prevision.crear_asociacion_descripcion import (
    CrearAsociacionDescripcion,
)
from gestor_gastos.aplicacion.prevision.eliminar_asociacion_descripcion import (
    EliminarAsociacionDescripcion,
)
from gestor_gastos.aplicacion.prevision.listar_asociaciones_descripcion import (
    ListarAsociacionesDescripcion,
)
from gestor_gastos.dominio.excepciones import AsociacionDuplicadaError, EntidadNoEncontradaError
from tests.unitarios.aplicacion.dobles import (
    RepositorioAsociacionesDescripcionFalso,
    RepositorioCategoriasFalso,
)


def _preparar():
    repo_asociaciones = RepositorioAsociacionesDescripcionFalso()
    repo_categorias = RepositorioCategoriasFalso()
    resumen = CrearCategoria(repo_categorias).ejecutar("Impuestos")
    return repo_asociaciones, repo_categorias, resumen


def test_crear_asociacion_descripcion_a_nivel_de_categoria() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()

    asociacion = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Ayuntamiento Las Rozas",
    )

    assert asociacion.id is not None
    assert asociacion.descripcion == "Recibo Ayuntamiento Las Rozas"
    assert repo_asociaciones.listar() == [asociacion]


def test_crear_asociacion_descripcion_recorta_espacios() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()

    asociacion = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="  Recibo Ayuntamiento Las Rozas  ",
    )

    assert asociacion.descripcion == "Recibo Ayuntamiento Las Rozas"


def test_crear_asociacion_descripcion_colapsa_espacios_multiples() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()

    asociacion = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo SANITAS S A  DE SEGUROS",
    )

    assert asociacion.descripcion == "Recibo SANITAS S A DE SEGUROS"


def test_crear_asociacion_descripcion_con_subcategoria() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()
    subcategoria = CrearSubcategoria(repo_categorias).ejecutar(resumen.id, "IBI")

    asociacion = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=subcategoria.id,
        descripcion="Recibo Diputación OPAEF",
    )

    assert asociacion.subcategoria_resumen_id == subcategoria.id


def test_crear_asociacion_descripcion_con_categoria_inexistente_falla() -> None:
    repo_asociaciones, repo_categorias, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
            categoria_resumen_id=999,
            subcategoria_resumen_id=None,
            descripcion="Recibo Ayuntamiento Las Rozas",
        )


def test_crear_asociacion_descripcion_con_subcategoria_de_otra_categoria_falla() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Otra")
    sub_de_otra = CrearSubcategoria(repo_categorias).ejecutar(otra_categoria.id, "Sub")

    with pytest.raises(EntidadNoEncontradaError):
        CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=sub_de_otra.id,
            descripcion="Recibo Ayuntamiento Las Rozas",
        )


def test_crear_asociacion_descripcion_duplicada_falla() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Otra")
    CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Ayuntamiento Las Rozas",
    )

    with pytest.raises(AsociacionDuplicadaError):
        CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
            categoria_resumen_id=otra_categoria.id,
            subcategoria_resumen_id=None,
            descripcion="Recibo Ayuntamiento Las Rozas",
        )


def test_listar_asociaciones_descripcion_vacio() -> None:
    repo_asociaciones = RepositorioAsociacionesDescripcionFalso()

    assert ListarAsociacionesDescripcion(repo_asociaciones).ejecutar() == []


def test_eliminar_asociacion_descripcion_inexistente_falla() -> None:
    repo_asociaciones = RepositorioAsociacionesDescripcionFalso()

    with pytest.raises(EntidadNoEncontradaError):
        EliminarAsociacionDescripcion(repo_asociaciones).ejecutar(999)


def test_eliminar_asociacion_descripcion_la_borra() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()
    asociacion = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Ayuntamiento Las Rozas",
    )

    EliminarAsociacionDescripcion(repo_asociaciones).ejecutar(asociacion.id)

    assert repo_asociaciones.listar() == []


def test_actualizar_asociacion_descripcion_cambia_la_descripcion_y_recorta_espacios() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()
    asociacion = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Ayuntamiento Las Rozas",
    )

    actualizada = ActualizarAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        asociacion.id,
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="  Recibo Diputación OPAEF  ",
    )

    assert actualizada.descripcion == "Recibo Diputación OPAEF"
    assert repo_asociaciones.obtener_por_id(asociacion.id).descripcion == "Recibo Diputación OPAEF"


def test_actualizar_asociacion_descripcion_colapsa_espacios_multiples() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()
    asociacion = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Ayuntamiento Las Rozas",
    )

    actualizada = ActualizarAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        asociacion.id,
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo SANITAS S A  DE SEGUROS",
    )

    assert actualizada.descripcion == "Recibo SANITAS S A DE SEGUROS"


def test_actualizar_asociacion_descripcion_sin_cambiarla_no_falla_por_duplicado_consigo_misma() -> (
    None
):
    repo_asociaciones, repo_categorias, resumen = _preparar()
    asociacion = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Ayuntamiento Las Rozas",
    )

    actualizada = ActualizarAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        asociacion.id,
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Ayuntamiento Las Rozas",
    )

    assert actualizada.id == asociacion.id


def test_actualizar_asociacion_descripcion_a_la_descripcion_de_otra_falla() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Otra")
    CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Ayuntamiento Las Rozas",
    )
    asociacion_a_editar = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=otra_categoria.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Diputación OPAEF",
    )

    with pytest.raises(AsociacionDuplicadaError):
        ActualizarAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
            asociacion_a_editar.id,
            categoria_resumen_id=otra_categoria.id,
            subcategoria_resumen_id=None,
            descripcion="Recibo Ayuntamiento Las Rozas",
        )


def test_actualizar_asociacion_descripcion_inexistente_falla() -> None:
    _, repo_categorias, resumen = _preparar()
    repo_asociaciones = RepositorioAsociacionesDescripcionFalso()

    with pytest.raises(EntidadNoEncontradaError):
        ActualizarAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
            999,
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=None,
            descripcion="Recibo Ayuntamiento Las Rozas",
        )


def test_actualizar_asociacion_descripcion_con_categoria_inexistente_falla() -> None:
    repo_asociaciones, repo_categorias, resumen = _preparar()
    asociacion = CrearAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=resumen.id,
        subcategoria_resumen_id=None,
        descripcion="Recibo Ayuntamiento Las Rozas",
    )

    with pytest.raises(EntidadNoEncontradaError):
        ActualizarAsociacionDescripcion(repo_asociaciones, repo_categorias).ejecutar(
            asociacion.id,
            categoria_resumen_id=999,
            subcategoria_resumen_id=None,
            descripcion="Recibo Ayuntamiento Las Rozas",
        )
