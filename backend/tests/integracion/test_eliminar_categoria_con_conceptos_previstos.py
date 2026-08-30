from decimal import Decimal

from gestor_gastos.aplicacion.categoria.eliminar_categoria import EliminarCategoria
from gestor_gastos.aplicacion.categoria.eliminar_subcategoria import EliminarSubcategoria
from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_asociaciones_descripcion_sqlalchemy import (  # noqa: E501
    RepositorioAsociacionesDescripcionSqlAlchemy,
)
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

# Reproduce el error 500 real reportado: la restricción de clave foránea de
# conceptos_previstos hacia categorias/subcategorias no se tenía en cuenta al
# borrar en cascada, y solo se detecta contra MySQL de verdad (los dobles en
# memoria de los tests unitarios no aplican restricciones de FK).


def test_eliminar_categoria_en_cascada_con_concepto_previsto_directo(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_asociaciones = RepositorioAsociacionesSqlAlchemy(sesion_bd)
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )

    EliminarCategoria(
        repo_categorias,
        repo_movimientos,
        repo_previsiones,
        repo_asociaciones,
        repo_asociaciones_descripcion,
    ).ejecutar(categoria.id, cascada=True)

    assert repo_categorias.obtener_categoria_por_id(categoria.id) is None


def test_eliminar_categoria_en_cascada_con_concepto_previsto_sobre_subcategoria(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_asociaciones = RepositorioAsociacionesSqlAlchemy(sesion_bd)
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    subcategoria = repo_categorias.crear_subcategoria(
        Subcategoria(nombre="Streaming", categoria_id=categoria.id)
    )
    concepto = repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )

    EliminarCategoria(
        repo_categorias,
        repo_movimientos,
        repo_previsiones,
        repo_asociaciones,
        repo_asociaciones_descripcion,
    ).ejecutar(categoria.id, cascada=True)

    assert repo_categorias.obtener_categoria_por_id(categoria.id) is None
    assert repo_categorias.obtener_subcategoria_por_id(subcategoria.id) is None
    assert repo_previsiones.obtener_por_id(concepto.id) is None


def test_eliminar_subcategoria_en_cascada_con_concepto_previsto(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_asociaciones = RepositorioAsociacionesSqlAlchemy(sesion_bd)
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    subcategoria = repo_categorias.crear_subcategoria(
        Subcategoria(nombre="Streaming", categoria_id=categoria.id)
    )
    concepto = repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )

    EliminarSubcategoria(
        repo_categorias,
        repo_movimientos,
        repo_previsiones,
        repo_asociaciones,
        repo_asociaciones_descripcion,
    ).ejecutar(subcategoria.id, cascada=True)

    assert repo_categorias.obtener_subcategoria_por_id(subcategoria.id) is None
    assert repo_previsiones.obtener_por_id(concepto.id) is None
    assert repo_categorias.obtener_categoria_por_id(categoria.id) is not None
