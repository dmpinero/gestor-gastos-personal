import datetime

from gestor_gastos.dominio.adjunto.almacen import AlmacenAdjuntos
from gestor_gastos.dominio.adjunto.entidades import Adjunto
from gestor_gastos.dominio.adjunto.excepciones import AdjuntoDemasiadoGrandeError
from gestor_gastos.dominio.adjunto.repositorio import RepositorioAdjuntos
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos

TAMANIO_MAXIMO_BYTES = 10 * 1024 * 1024


class SubirAdjunto:
    def __init__(
        self,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_adjuntos: RepositorioAdjuntos,
        almacen: AlmacenAdjuntos,
    ) -> None:
        self._repositorio_movimientos = repositorio_movimientos
        self._repositorio_adjuntos = repositorio_adjuntos
        self._almacen = almacen

    def ejecutar(
        self,
        movimiento_id: int,
        nombre_original: str,
        tipo_mime: str | None,
        contenido: bytes,
    ) -> Adjunto:
        if self._repositorio_movimientos.obtener_por_id(movimiento_id) is None:
            raise EntidadNoEncontradaError(f"No existe el movimiento con id {movimiento_id}")
        if len(contenido) > TAMANIO_MAXIMO_BYTES:
            raise AdjuntoDemasiadoGrandeError(
                f"El fichero supera el tamaño máximo permitido "
                f"({TAMANIO_MAXIMO_BYTES // (1024 * 1024)} MB)"
            )

        nombre_almacenado = self._almacen.guardar(contenido, nombre_original)
        return self._repositorio_adjuntos.crear(
            Adjunto(
                movimiento_id=movimiento_id,
                nombre_original=nombre_original,
                nombre_almacenado=nombre_almacenado,
                tipo_mime=tipo_mime,
                tamanio_bytes=len(contenido),
                fecha_subida=datetime.datetime.now(),
            )
        )
