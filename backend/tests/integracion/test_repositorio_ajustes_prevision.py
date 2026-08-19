from decimal import Decimal

from gestor_gastos.dominio.categoria.entidades import Categoria
from gestor_gastos.dominio.prevision.entidades import AjusteMensual, ConceptoPrevisto
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_ajustes_prevision_sqlalchemy import (  # noqa: E501
    RepositorioAjustesPrevisionSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)


def _crear_concepto(sesion_bd) -> ConceptoPrevisto:
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    return RepositorioPrevisionesSqlAlchemy(sesion_bd).crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )


def test_guardar_crea_el_ajuste_si_no_existia(sesion_bd) -> None:
    concepto = _crear_concepto(sesion_bd)
    repositorio = RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)

    guardado = repositorio.guardar(
        AjusteMensual(concepto_id=concepto.id, anio=2026, mes=5, importe=Decimal("-30.00"))
    )

    assert guardado.id is not None
    assert repositorio.listar_por_anio(2026) == [guardado]


def test_guardar_dos_veces_con_la_misma_clave_actualiza_el_importe(sesion_bd) -> None:
    concepto = _crear_concepto(sesion_bd)
    repositorio = RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)
    repositorio.guardar(
        AjusteMensual(concepto_id=concepto.id, anio=2026, mes=5, importe=Decimal("-30.00"))
    )

    repositorio.guardar(
        AjusteMensual(concepto_id=concepto.id, anio=2026, mes=5, importe=Decimal("-45.00"))
    )

    ajustes = repositorio.listar_por_anio(2026)
    assert len(ajustes) == 1
    assert ajustes[0].importe == Decimal("-45.00")


def test_eliminar_borra_el_ajuste(sesion_bd) -> None:
    concepto = _crear_concepto(sesion_bd)
    repositorio = RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)
    repositorio.guardar(
        AjusteMensual(concepto_id=concepto.id, anio=2026, mes=5, importe=Decimal("-30.00"))
    )

    repositorio.eliminar(concepto.id, 2026, 5)

    assert repositorio.listar_por_anio(2026) == []


def test_eliminar_concepto_previsto_borra_en_cascada_sus_ajustes(sesion_bd) -> None:
    concepto = _crear_concepto(sesion_bd)
    repo_ajustes = RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)
    repo_ajustes.guardar(
        AjusteMensual(concepto_id=concepto.id, anio=2026, mes=5, importe=Decimal("-30.00"))
    )

    RepositorioPrevisionesSqlAlchemy(sesion_bd).eliminar(concepto.id)

    assert repo_ajustes.listar_por_anio(2026) == []
