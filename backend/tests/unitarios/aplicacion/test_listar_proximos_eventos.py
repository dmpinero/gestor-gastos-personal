import datetime
from decimal import Decimal

from gestor_gastos.aplicacion.notificaciones.listar_proximos_eventos import (
    ListarProximosEventos,
)
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.prevision.entidades import (
    AsociacionConcepto,
    AsociacionDescripcion,
    ConceptoPrevisto,
)
from tests.unitarios.aplicacion.dobles import (
    RepositorioAsociacionesDescripcionFalso,
    RepositorioAsociacionesFalso,
    RepositorioMovimientosFalso,
    RepositorioPrevisionesFalso,
)


def _caso_de_uso(
    repo_movimientos: RepositorioMovimientosFalso | None = None,
    repo_previsiones: RepositorioPrevisionesFalso | None = None,
    repo_asociaciones: RepositorioAsociacionesFalso | None = None,
    repo_asociaciones_descripcion: RepositorioAsociacionesDescripcionFalso | None = None,
) -> ListarProximosEventos:
    return ListarProximosEventos(
        repo_movimientos or RepositorioMovimientosFalso(),
        repo_previsiones or RepositorioPrevisionesFalso(),
        repo_asociaciones or RepositorioAsociacionesFalso(),
        repo_asociaciones_descripcion or RepositorioAsociacionesDescripcionFalso(),
    )


def _movimiento(
    descripcion: str,
    fecha_valor: datetime.date,
    categoria_id: int = 1,
    subcategoria_id: int | None = None,
    importe: Decimal = Decimal("-36.00"),
) -> Movimiento:
    return Movimiento(
        cuenta_id=1,
        categoria_id=categoria_id,
        subcategoria_id=subcategoria_id,
        fecha_valor=fecha_valor,
        descripcion=descripcion,
        importe=importe,
        saldo=Decimal("0.00"),
    )


HOY = datetime.date(2025, 10, 2)


def test_sin_conceptos_previstos_no_hay_proximos_eventos() -> None:
    repo_movimientos = RepositorioMovimientosFalso()
    repo_movimientos.crear(_movimiento("AMAZON PRIME", datetime.date(2024, 10, 1)))
    repo_movimientos.crear(_movimiento("AMAZON PRIME", datetime.date(2025, 10, 1)))

    eventos = _caso_de_uso(repo_movimientos=repo_movimientos).ejecutar(hoy=HOY)

    assert eventos == []


def test_solo_detecta_movimientos_de_una_categoria_con_concepto_previsto() -> None:
    repo_movimientos = RepositorioMovimientosFalso()
    repo_movimientos.crear(_movimiento("AMAZON PRIME", datetime.date(2024, 10, 1), categoria_id=1))
    repo_movimientos.crear(_movimiento("AMAZON PRIME", datetime.date(2025, 10, 1), categoria_id=1))
    # Misma periodicidad, pero en una categoría sin concepto previsto: debe ignorarse.
    repo_movimientos.crear(_movimiento("NETFLIX", datetime.date(2024, 10, 1), categoria_id=2))
    repo_movimientos.crear(_movimiento("NETFLIX", datetime.date(2025, 10, 1), categoria_id=2))

    repo_previsiones = RepositorioPrevisionesFalso()
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=1,
            subcategoria_id=None,
            periodicidad="anual",
            importe_previsto=Decimal("-36.00"),
        )
    )

    eventos = _caso_de_uso(
        repo_movimientos=repo_movimientos, repo_previsiones=repo_previsiones
    ).ejecutar(hoy=HOY)

    assert [e.descripcion for e in eventos] == ["AMAZON PRIME"]


def test_categoria_de_movimientos_resuelta_via_asociacion_concepto() -> None:
    # El concepto previsto se nombra con la categoría 10 ("Suscripciones" del
    # resumen), pero los movimientos reales usan la categoría 99.
    repo_movimientos = RepositorioMovimientosFalso()
    repo_movimientos.crear(_movimiento("AMAZON PRIME", datetime.date(2024, 10, 1), categoria_id=99))
    repo_movimientos.crear(_movimiento("AMAZON PRIME", datetime.date(2025, 10, 1), categoria_id=99))

    repo_previsiones = RepositorioPrevisionesFalso()
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=10,
            subcategoria_id=None,
            periodicidad="anual",
            importe_previsto=Decimal("-36.00"),
        )
    )
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=10,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=99,
            subcategoria_movimiento_id=None,
        )
    )

    eventos = _caso_de_uso(
        repo_movimientos=repo_movimientos,
        repo_previsiones=repo_previsiones,
        repo_asociaciones=repo_asociaciones,
    ).ejecutar(hoy=HOY)

    assert [e.descripcion for e in eventos] == ["AMAZON PRIME"]


def test_descripcion_resuelta_via_asociacion_descripcion() -> None:
    # El recibo tiene categoría/subcategoría propia (sin relación directa con
    # ningún concepto), pero su descripción está asociada a un concepto.
    repo_movimientos = RepositorioMovimientosFalso()
    repo_movimientos.crear(
        _movimiento("RECIBO SEGURO HOGAR XYZ", datetime.date(2024, 10, 1), categoria_id=50)
    )
    repo_movimientos.crear(
        _movimiento("RECIBO SEGURO HOGAR XYZ", datetime.date(2025, 10, 1), categoria_id=50)
    )

    repo_previsiones = RepositorioPrevisionesFalso()
    repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=10,
            subcategoria_id=None,
            periodicidad="anual",
            importe_previsto=Decimal("-100.00"),
        )
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=10,
            subcategoria_resumen_id=None,
            descripcion="seguro hogar",
        )
    )

    eventos = _caso_de_uso(
        repo_movimientos=repo_movimientos,
        repo_previsiones=repo_previsiones,
        repo_asociaciones_descripcion=repo_asociaciones_descripcion,
    ).ejecutar(hoy=HOY)

    assert [e.descripcion for e in eventos] == ["RECIBO SEGURO HOGAR XYZ"]
