from decimal import Decimal

from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)


def test_crear_obtener_y_listar_concepto_previsto(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    subcategoria = repo_categorias.crear_subcategoria(
        Subcategoria(nombre="Amazon Prime", categoria_id=categoria.id)
    )
    repositorio = RepositorioPrevisionesSqlAlchemy(sesion_bd)

    creado = repositorio.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            periodicidad="mensual",
            importe_previsto=Decimal("-4.99"),
        )
    )

    assert creado.id is not None
    obtenido = repositorio.obtener_por_id(creado.id)
    assert obtenido is not None
    assert obtenido.subcategoria_id == subcategoria.id
    assert repositorio.listar() == [obtenido]


def test_actualizar_y_eliminar_concepto_previsto(sesion_bd) -> None:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Impuestos"))
    otra_categoria = repo_categorias.crear_categoria(Categoria(nombre="Vivienda"))
    repositorio = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    concepto = repositorio.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="anual",
            importe_previsto=Decimal("-221.22"),
            mes_inicio=3,
        )
    )

    concepto.categoria_id = otra_categoria.id
    concepto.periodicidad = "semestral"
    concepto.mes_inicio = 6
    repositorio.actualizar(concepto)

    actualizado = repositorio.obtener_por_id(concepto.id)
    assert actualizado.categoria_id == otra_categoria.id
    assert actualizado.periodicidad == "semestral"
    assert actualizado.mes_inicio == 6

    repositorio.eliminar(concepto.id)
    assert repositorio.obtener_por_id(concepto.id) is None
