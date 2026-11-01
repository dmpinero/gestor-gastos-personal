import datetime
from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.adjunto.subir_adjunto import SubirAdjunto
from gestor_gastos.dominio.adjunto.excepciones import AdjuntoDemasiadoGrandeError
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from tests.unitarios.aplicacion.dobles import (
    AlmacenAdjuntosFalso,
    RepositorioAdjuntosFalso,
    RepositorioMovimientosFalso,
)


def _movimiento_creado(repo_movimientos: RepositorioMovimientosFalso) -> Movimiento:
    return repo_movimientos.crear(
        Movimiento(
            cuenta_id=1,
            categoria_id=1,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Supermercado",
            importe=Decimal("-30.00"),
            saldo=Decimal("970.00"),
        )
    )


def test_movimiento_inexistente_lanza_error() -> None:
    caso_de_uso = SubirAdjunto(
        RepositorioMovimientosFalso(), RepositorioAdjuntosFalso(), AlmacenAdjuntosFalso()
    )

    with pytest.raises(EntidadNoEncontradaError):
        caso_de_uso.ejecutar(999, "ticket.pdf", "application/pdf", b"contenido")


def test_fichero_demasiado_grande_lanza_error() -> None:
    repo_movimientos = RepositorioMovimientosFalso()
    movimiento = _movimiento_creado(repo_movimientos)
    caso_de_uso = SubirAdjunto(repo_movimientos, RepositorioAdjuntosFalso(), AlmacenAdjuntosFalso())
    contenido_demasiado_grande = b"0" * (10 * 1024 * 1024 + 1)

    with pytest.raises(AdjuntoDemasiadoGrandeError):
        caso_de_uso.ejecutar(
            movimiento.id, "ticket.pdf", "application/pdf", contenido_demasiado_grande
        )


def test_sube_el_adjunto_correctamente() -> None:
    repo_movimientos = RepositorioMovimientosFalso()
    movimiento = _movimiento_creado(repo_movimientos)
    repo_adjuntos = RepositorioAdjuntosFalso()
    almacen = AlmacenAdjuntosFalso()
    caso_de_uso = SubirAdjunto(repo_movimientos, repo_adjuntos, almacen)

    adjunto = caso_de_uso.ejecutar(movimiento.id, "ticket.pdf", "application/pdf", b"contenido")

    assert adjunto.id is not None
    assert adjunto.movimiento_id == movimiento.id
    assert adjunto.nombre_original == "ticket.pdf"
    assert adjunto.tipo_mime == "application/pdf"
    assert adjunto.tamanio_bytes == len(b"contenido")
    assert almacen.leer(adjunto.nombre_almacenado) == b"contenido"
    assert repo_adjuntos.listar_por_movimiento(movimiento.id) == [adjunto]
