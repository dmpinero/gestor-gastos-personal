from gestor_gastos.aplicacion.categoria.eliminar_categoria import EliminarCategoria
from gestor_gastos.aplicacion.categoria.eliminar_subcategoria import EliminarSubcategoria
from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.prevision.entidades import AsociacionConcepto
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_asociaciones_sqlalchemy import (  # noqa: E501
    RepositorioAsociacionesSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)

# Reproduce contra MySQL de verdad las restricciones de clave foránea del
# nuevo modelo AsociacionConceptoModelo, que referencia categorias/
# subcategorias dos veces (lado resumen y lado movimiento): los dobles en
# memoria de los tests unitarios no las detectarían.


def test_eliminar_categoria_referenciada_como_lado_resumen_en_cascada(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_asociaciones = RepositorioAsociacionesSqlAlchemy(sesion_bd)
    resumen = repo_categorias.crear_categoria(Categoria(nombre="Comida"))
    movimiento = repo_categorias.crear_categoria(Categoria(nombre="Alimentación"))
    asociacion = repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )
    )

    EliminarCategoria(
        repo_categorias, repo_movimientos, repo_previsiones, repo_asociaciones
    ).ejecutar(resumen.id, cascada=True)

    assert repo_categorias.obtener_categoria_por_id(resumen.id) is None
    assert repo_asociaciones.obtener_por_id(asociacion.id) is None
    assert repo_categorias.obtener_categoria_por_id(movimiento.id) is not None


def test_eliminar_categoria_referenciada_como_lado_movimiento_en_cascada(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_asociaciones = RepositorioAsociacionesSqlAlchemy(sesion_bd)
    resumen = repo_categorias.crear_categoria(Categoria(nombre="Comida"))
    movimiento = repo_categorias.crear_categoria(Categoria(nombre="Alimentación"))
    asociacion = repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )
    )

    EliminarCategoria(
        repo_categorias, repo_movimientos, repo_previsiones, repo_asociaciones
    ).ejecutar(movimiento.id, cascada=True)

    assert repo_categorias.obtener_categoria_por_id(movimiento.id) is None
    assert repo_asociaciones.obtener_por_id(asociacion.id) is None
    assert repo_categorias.obtener_categoria_por_id(resumen.id) is not None


def test_eliminar_subcategoria_con_asociacion_en_cascada(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_asociaciones = RepositorioAsociacionesSqlAlchemy(sesion_bd)
    resumen = repo_categorias.crear_categoria(Categoria(nombre="Comida"))
    sub_resumen = repo_categorias.crear_subcategoria(
        Subcategoria(nombre="comida", categoria_id=resumen.id)
    )
    movimiento = repo_categorias.crear_categoria(Categoria(nombre="Alimentación"))
    asociacion = repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=resumen.id,
            subcategoria_resumen_id=sub_resumen.id,
            categoria_movimiento_id=movimiento.id,
            subcategoria_movimiento_id=None,
        )
    )

    EliminarSubcategoria(
        repo_categorias, repo_movimientos, repo_previsiones, repo_asociaciones
    ).ejecutar(sub_resumen.id, cascada=True)

    assert repo_categorias.obtener_subcategoria_por_id(sub_resumen.id) is None
    assert repo_asociaciones.obtener_por_id(asociacion.id) is None
    assert repo_categorias.obtener_categoria_por_id(resumen.id) is not None
