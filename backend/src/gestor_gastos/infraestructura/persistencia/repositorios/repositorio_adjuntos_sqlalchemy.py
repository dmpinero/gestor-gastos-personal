from sqlalchemy import func, select
from sqlalchemy.orm import Session

from gestor_gastos.dominio.adjunto.entidades import Adjunto
from gestor_gastos.infraestructura.persistencia.modelos import AdjuntoMovimientoModelo


def _a_entidad(modelo: AdjuntoMovimientoModelo) -> Adjunto:
    return Adjunto(
        id=modelo.id,
        movimiento_id=modelo.movimiento_id,
        nombre_original=modelo.nombre_original,
        nombre_almacenado=modelo.nombre_almacenado,
        tipo_mime=modelo.tipo_mime,
        tamanio_bytes=modelo.tamanio_bytes,
        fecha_subida=modelo.fecha_subida,
    )


class RepositorioAdjuntosSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def crear(self, adjunto: Adjunto) -> Adjunto:
        modelo = AdjuntoMovimientoModelo(
            movimiento_id=adjunto.movimiento_id,
            nombre_original=adjunto.nombre_original,
            nombre_almacenado=adjunto.nombre_almacenado,
            tipo_mime=adjunto.tipo_mime,
            tamanio_bytes=adjunto.tamanio_bytes,
            fecha_subida=adjunto.fecha_subida,
        )
        self._sesion.add(modelo)
        self._sesion.commit()
        return _a_entidad(modelo)

    def obtener_por_id(self, id_adjunto: int) -> Adjunto | None:
        modelo = self._sesion.get(AdjuntoMovimientoModelo, id_adjunto)
        return _a_entidad(modelo) if modelo is not None else None

    def listar_por_movimiento(self, movimiento_id: int) -> list[Adjunto]:
        modelos = self._sesion.scalars(
            select(AdjuntoMovimientoModelo)
            .where(AdjuntoMovimientoModelo.movimiento_id == movimiento_id)
            .order_by(AdjuntoMovimientoModelo.fecha_subida.desc())
        ).all()
        return [_a_entidad(m) for m in modelos]

    def contar_por_movimiento_de_todos(self) -> dict[int, int]:
        filas = self._sesion.execute(
            select(
                AdjuntoMovimientoModelo.movimiento_id,
                func.count(AdjuntoMovimientoModelo.id),
            ).group_by(AdjuntoMovimientoModelo.movimiento_id)
        ).all()
        return {movimiento_id: cantidad for movimiento_id, cantidad in filas}

    def eliminar(self, id_adjunto: int) -> None:
        modelo = self._sesion.get(AdjuntoMovimientoModelo, id_adjunto)
        if modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()
