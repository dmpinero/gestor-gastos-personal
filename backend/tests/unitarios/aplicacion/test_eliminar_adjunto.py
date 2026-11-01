import datetime

import pytest

from gestor_gastos.aplicacion.adjunto.eliminar_adjunto import EliminarAdjunto
from gestor_gastos.dominio.adjunto.entidades import Adjunto
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from tests.unitarios.aplicacion.dobles import AlmacenAdjuntosFalso, RepositorioAdjuntosFalso


def test_adjunto_inexistente_lanza_error() -> None:
    caso_de_uso = EliminarAdjunto(RepositorioAdjuntosFalso(), AlmacenAdjuntosFalso())

    with pytest.raises(EntidadNoEncontradaError):
        caso_de_uso.ejecutar(999)


def test_elimina_el_fichero_y_la_fila() -> None:
    repo_adjuntos = RepositorioAdjuntosFalso()
    almacen = AlmacenAdjuntosFalso()
    nombre_almacenado = almacen.guardar(b"contenido", "ticket.pdf")
    adjunto = repo_adjuntos.crear(
        Adjunto(
            movimiento_id=1,
            nombre_original="ticket.pdf",
            nombre_almacenado=nombre_almacenado,
            tipo_mime="application/pdf",
            tamanio_bytes=9,
            fecha_subida=datetime.datetime(2026, 1, 1),
        )
    )

    EliminarAdjunto(repo_adjuntos, almacen).ejecutar(adjunto.id)

    assert repo_adjuntos.obtener_por_id(adjunto.id) is None
    with pytest.raises(KeyError):
        almacen.leer(nombre_almacenado)
