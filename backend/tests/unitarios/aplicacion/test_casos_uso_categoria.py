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
from gestor_gastos.aplicacion.categoria.obtener_dependencias_categoria import (
    ObtenerDependenciasCategoria,
)
from gestor_gastos.aplicacion.categoria.obtener_dependencias_subcategoria import (
    ObtenerDependenciasSubcategoria,
)
from gestor_gastos.dominio.excepciones import (
    EntidadConDependenciasError,
    EntidadNoEncontradaError,
    NombreDuplicadoError,
)
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.prevision.entidades import AsociacionConcepto, ConceptoPrevisto
from tests.unitarios.aplicacion.dobles import (
    RepositorioAsociacionesFalso,
    RepositorioCategoriasFalso,
    RepositorioMovimientosFalso,
    RepositorioPrevisionesFalso,
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
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    CrearSubcategoria(repo).ejecutar(categoria.id, "Cafeterías y restaurantes")

    with pytest.raises(EntidadConDependenciasError):
        EliminarCategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
            categoria.id
        )


def test_eliminar_categoria_con_subcategorias_y_movimientos_y_cascada_borra_todo() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Cafeterías y restaurantes")
    movimiento = repo_movimientos.crear(
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

    EliminarCategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
        categoria.id, cascada=True
    )

    assert repo.obtener_categoria_por_id(categoria.id) is None
    assert repo.obtener_subcategoria_por_id(subcategoria.id) is None
    assert repo_movimientos.obtener_por_id(movimiento.id) is None


def test_eliminar_categoria_con_concepto_previsto_falla_sin_cascada() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    categoria = CrearCategoria(repo).ejecutar("Suscripciones")
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )

    with pytest.raises(EntidadConDependenciasError):
        EliminarCategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
            categoria.id
        )


def test_eliminar_categoria_con_concepto_previsto_y_cascada_lo_borra() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    categoria = CrearCategoria(repo).ejecutar("Suscripciones")
    concepto = repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )

    EliminarCategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
        categoria.id, cascada=True
    )

    assert repo.obtener_categoria_por_id(categoria.id) is None
    assert repo_previsiones.obtener_por_id(concepto.id) is None


def test_eliminar_categoria_sin_dependencias_la_borra() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    categoria = CrearCategoria(repo).ejecutar("Hogar")

    EliminarCategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
        categoria.id
    )

    assert repo.obtener_categoria_por_id(categoria.id) is None


def test_eliminar_categoria_con_asociacion_falla_sin_cascada() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    resumen = CrearCategoria(repo).ejecutar("Comida")
    movimiento = CrearCategoria(repo).ejecutar("Alimentación")
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )
    )

    with pytest.raises(EntidadConDependenciasError):
        EliminarCategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
            resumen.id
        )


def test_eliminar_categoria_con_asociacion_y_cascada_la_borra() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    resumen = CrearCategoria(repo).ejecutar("Comida")
    movimiento = CrearCategoria(repo).ejecutar("Alimentación")
    asociacion = repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )
    )

    EliminarCategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
        resumen.id, cascada=True
    )

    assert repo.obtener_categoria_por_id(resumen.id) is None
    assert repo_asociaciones.obtener_por_id(asociacion.id) is None
    # La categoría de movimientos referenciada como el otro lado de la
    # asociación no se ve afectada.
    assert repo.obtener_categoria_por_id(movimiento.id) is not None


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
    repo_movimientos = RepositorioMovimientosFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Cafes")

    actualizada = ActualizarSubcategoria(repo, repo_movimientos).ejecutar(
        subcategoria.id, "Cafeterías y restaurantes", categoria.id
    )

    assert actualizada.nombre == "Cafeterías y restaurantes"


def test_actualizar_subcategoria_con_su_propio_nombre_no_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Cafes")

    actualizada = ActualizarSubcategoria(repo, repo_movimientos).ejecutar(
        subcategoria.id, "Cafes", categoria.id
    )

    assert actualizada.nombre == "Cafes"


def test_actualizar_subcategoria_con_nombre_de_otra_de_la_misma_categoria_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    CrearSubcategoria(repo).ejecutar(categoria.id, "Cafes")
    hoteles = CrearSubcategoria(repo).ejecutar(categoria.id, "Hoteles")

    with pytest.raises(NombreDuplicadoError):
        ActualizarSubcategoria(repo, repo_movimientos).ejecutar(hoteles.id, "Cafes", categoria.id)


def test_actualizar_subcategoria_con_nombre_de_otra_categoria_no_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    compras = CrearCategoria(repo).ejecutar("Compras")
    hogar = CrearCategoria(repo).ejecutar("Hogar")
    CrearSubcategoria(repo).ejecutar(compras.id, "Otros")
    de_hogar = CrearSubcategoria(repo).ejecutar(hogar.id, "Varios")

    actualizada = ActualizarSubcategoria(repo, repo_movimientos).ejecutar(
        de_hogar.id, "Otros", hogar.id
    )

    assert actualizada.nombre == "Otros"


def test_actualizar_subcategoria_con_categoria_destino_inexistente_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Cafes")

    with pytest.raises(EntidadNoEncontradaError):
        ActualizarSubcategoria(repo, repo_movimientos).ejecutar(subcategoria.id, "Cafes", 999)


def test_mover_subcategoria_a_otra_categoria_la_reasigna() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    origen = CrearCategoria(repo).ejecutar("Ocio y viajes")
    destino = CrearCategoria(repo).ejecutar("Hogar")
    subcategoria = CrearSubcategoria(repo).ejecutar(origen.id, "Cafes")

    actualizada = ActualizarSubcategoria(repo, repo_movimientos).ejecutar(
        subcategoria.id, "Cafes", destino.id
    )

    assert actualizada.categoria_id == destino.id


def test_mover_subcategoria_con_nombre_duplicado_en_categoria_destino_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    origen = CrearCategoria(repo).ejecutar("Ocio y viajes")
    destino = CrearCategoria(repo).ejecutar("Hogar")
    subcategoria = CrearSubcategoria(repo).ejecutar(origen.id, "Otros")
    CrearSubcategoria(repo).ejecutar(destino.id, "Otros")

    with pytest.raises(NombreDuplicadoError):
        ActualizarSubcategoria(repo, repo_movimientos).ejecutar(
            subcategoria.id, "Otros", destino.id
        )


def test_mover_subcategoria_actualiza_la_categoria_de_sus_movimientos() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    origen = CrearCategoria(repo).ejecutar("Ocio y viajes")
    destino = CrearCategoria(repo).ejecutar("Hogar")
    subcategoria = CrearSubcategoria(repo).ejecutar(origen.id, "Cafes")
    movimiento = repo_movimientos.crear(
        Movimiento(
            cuenta_id=1,
            categoria_id=origen.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Café",
            importe=Decimal("-3.50"),
            saldo=Decimal("100.00"),
        )
    )

    ActualizarSubcategoria(repo, repo_movimientos).ejecutar(subcategoria.id, "Cafes", destino.id)

    assert repo_movimientos.obtener_por_id(movimiento.id).categoria_id == destino.id


def test_eliminar_subcategoria_con_movimientos_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
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
        EliminarSubcategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
            subcategoria.id
        )


def test_eliminar_subcategoria_con_movimientos_y_cascada_borra_todo() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Cafeterías y restaurantes")
    movimiento = repo_movimientos.crear(
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

    EliminarSubcategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
        subcategoria.id, cascada=True
    )

    assert repo.obtener_subcategoria_por_id(subcategoria.id) is None
    assert repo_movimientos.obtener_por_id(movimiento.id) is None
    assert repo.obtener_categoria_por_id(categoria.id) is not None


def test_eliminar_subcategoria_con_concepto_previsto_falla_sin_cascada() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    categoria = CrearCategoria(repo).ejecutar("Suscripciones")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Streaming")
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )

    with pytest.raises(EntidadConDependenciasError):
        EliminarSubcategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
            subcategoria.id
        )


def test_eliminar_subcategoria_con_concepto_previsto_y_cascada_lo_borra() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    categoria = CrearCategoria(repo).ejecutar("Suscripciones")
    subcategoria = CrearSubcategoria(repo).ejecutar(categoria.id, "Streaming")
    concepto = repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )

    EliminarSubcategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
        subcategoria.id, cascada=True
    )

    assert repo.obtener_subcategoria_por_id(subcategoria.id) is None
    assert repo_previsiones.obtener_por_id(concepto.id) is None
    assert repo.obtener_categoria_por_id(categoria.id) is not None


def test_eliminar_subcategoria_con_asociacion_falla_sin_cascada() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    resumen = CrearCategoria(repo).ejecutar("Comida")
    sub_resumen = CrearSubcategoria(repo).ejecutar(resumen.id, "comida")
    movimiento = CrearCategoria(repo).ejecutar("Alimentación")
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=sub_resumen.id,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )
    )

    with pytest.raises(EntidadConDependenciasError):
        EliminarSubcategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
            sub_resumen.id
        )


def test_eliminar_subcategoria_con_asociacion_y_cascada_la_borra() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    resumen = CrearCategoria(repo).ejecutar("Comida")
    sub_resumen = CrearSubcategoria(repo).ejecutar(resumen.id, "comida")
    movimiento = CrearCategoria(repo).ejecutar("Alimentación")
    asociacion = repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=sub_resumen.id,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )
    )

    EliminarSubcategoria(repo, repo_movimientos, repo_previsiones, repo_asociaciones).ejecutar(
        sub_resumen.id, cascada=True
    )

    assert repo.obtener_subcategoria_por_id(sub_resumen.id) is None
    assert repo_asociaciones.obtener_por_id(asociacion.id) is None


def test_obtener_dependencias_de_categoria_inexistente_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()

    with pytest.raises(EntidadNoEncontradaError):
        ObtenerDependenciasCategoria(
            repo, repo_movimientos, repo_previsiones, repo_asociaciones
        ).ejecutar(999)


def test_obtener_dependencias_de_categoria_cuenta_subcategorias_movimientos_y_conceptos() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
    categoria = CrearCategoria(repo).ejecutar("Ocio y viajes")
    CrearSubcategoria(repo).ejecutar(categoria.id, "Cafeterías y restaurantes")
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=1,
            categoria_id=categoria.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Café",
            importe=Decimal("-3.50"),
            saldo=Decimal("100.00"),
        )
    )
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )

    dependencias = ObtenerDependenciasCategoria(
        repo, repo_movimientos, repo_previsiones, repo_asociaciones
    ).ejecutar(categoria.id)

    assert dependencias.subcategorias == 1
    assert dependencias.movimientos == 1
    assert dependencias.conceptos_previstos == 1
    assert dependencias.asociaciones == 0


def test_obtener_dependencias_de_subcategoria_inexistente_falla() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()

    with pytest.raises(EntidadNoEncontradaError):
        ObtenerDependenciasSubcategoria(
            repo, repo_movimientos, repo_previsiones, repo_asociaciones
        ).ejecutar(999)


def test_obtener_dependencias_de_subcategoria_cuenta_movimientos_y_conceptos() -> None:
    repo = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()
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
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )

    dependencias = ObtenerDependenciasSubcategoria(
        repo, repo_movimientos, repo_previsiones, repo_asociaciones
    ).ejecutar(subcategoria.id)

    assert dependencias.movimientos == 1
    assert dependencias.conceptos_previstos == 1
    assert dependencias.asociaciones == 0


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
