import datetime

import pytest

from gestor_gastos.aplicacion.adjunto.eliminar_adjuntos_de_movimiento import (
    EliminarAdjuntosDeMovimiento,
)
from gestor_gastos.dominio.adjunto.entidades import Adjunto
from tests.unitarios.aplicacion.dobles import AlmacenAdjuntosFalso, RepositorioAdjuntosFalso


def _adjunto(
    repo_adjuntos: RepositorioAdjuntosFalso, almacen: AlmacenAdjuntosFalso, movimiento_id: int
) -> Adjunto:
    nombre_almacenado = almacen.guardar(b"contenido", "ticket.pdf")
    return repo_adjuntos.crear(
        Adjunto(
            movimiento_id=movimiento_id,
            nombre_original="ticket.pdf",
            nombre_almacenado=nombre_almacenado,
            tipo_mime="application/pdf",
            tamanio_bytes=9,
            fecha_subida=datetime.datetime(2026, 1, 1),
        )
    )


def test_borra_del_disco_todos_los_adjuntos_del_movimiento_pero_no_los_de_otros() -> None:
    repo_adjuntos = RepositorioAdjuntosFalso()
    almacen = AlmacenAdjuntosFalso()
    adjunto_1 = _adjunto(repo_adjuntos, almacen, movimiento_id=1)
    adjunto_2 = _adjunto(repo_adjuntos, almacen, movimiento_id=1)
    adjunto_de_otro_movimiento = _adjunto(repo_adjuntos, almacen, movimiento_id=2)

    EliminarAdjuntosDeMovimiento(repo_adjuntos, almacen).ejecutar(1)

    with pytest.raises(KeyError):
        almacen.leer(adjunto_1.nombre_almacenado)
    with pytest.raises(KeyError):
        almacen.leer(adjunto_2.nombre_almacenado)
    assert almacen.leer(adjunto_de_otro_movimiento.nombre_almacenado) == b"contenido"


def test_sin_adjuntos_no_falla() -> None:
    EliminarAdjuntosDeMovimiento(RepositorioAdjuntosFalso(), AlmacenAdjuntosFalso()).ejecutar(1)
