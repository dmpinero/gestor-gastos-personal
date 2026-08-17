import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.infraestructura.persistencia.modelos import MovimientoModelo


def _a_entidad(modelo: MovimientoModelo) -> Movimiento:
    return Movimiento(
        id=modelo.id,
        cuenta_id=modelo.cuenta_id,
        categoria_id=modelo.categoria_id,
        subcategoria_id=modelo.subcategoria_id,
        fecha_valor=modelo.fecha_valor,
        descripcion=modelo.descripcion,
        comentario=modelo.comentario,
        importe=modelo.importe,
        saldo=modelo.saldo,
    )


class RepositorioMovimientosSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def crear(self, movimiento: Movimiento) -> Movimiento:
        modelo = MovimientoModelo(
            cuenta_id=movimiento.cuenta_id,
            categoria_id=movimiento.categoria_id,
            subcategoria_id=movimiento.subcategoria_id,
            fecha_valor=movimiento.fecha_valor,
            descripcion=movimiento.descripcion,
            comentario=movimiento.comentario,
            importe=movimiento.importe,
            saldo=movimiento.saldo,
        )
        self._sesion.add(modelo)
        self._sesion.commit()
        return _a_entidad(modelo)

    def obtener_por_id(self, id_movimiento: int) -> Movimiento | None:
        modelo = self._sesion.get(MovimientoModelo, id_movimiento)
        return _a_entidad(modelo) if modelo else None

    def listar_por_cuenta(self, id_cuenta: int) -> list[Movimiento]:
        modelos = self._sesion.scalars(
            select(MovimientoModelo)
            .where(MovimientoModelo.cuenta_id == id_cuenta)
            .order_by(MovimientoModelo.fecha_valor.desc())
        ).all()
        return [_a_entidad(m) for m in modelos]

    def actualizar(self, movimiento: Movimiento) -> Movimiento:
        modelo = self._sesion.get(MovimientoModelo, movimiento.id)
        modelo.cuenta_id = movimiento.cuenta_id
        modelo.categoria_id = movimiento.categoria_id
        modelo.subcategoria_id = movimiento.subcategoria_id
        modelo.fecha_valor = movimiento.fecha_valor
        modelo.descripcion = movimiento.descripcion
        modelo.comentario = movimiento.comentario
        modelo.importe = movimiento.importe
        modelo.saldo = movimiento.saldo
        self._sesion.commit()
        return _a_entidad(modelo)

    def eliminar(self, id_movimiento: int) -> None:
        modelo = self._sesion.get(MovimientoModelo, id_movimiento)
        if modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()

    def existe_duplicado(
        self,
        id_cuenta: int,
        fecha_valor: datetime.date,
        importe: Decimal,
        saldo: Decimal,
        descripcion: str,
    ) -> bool:
        return (
            self._sesion.scalar(
                select(MovimientoModelo).where(
                    MovimientoModelo.cuenta_id == id_cuenta,
                    MovimientoModelo.fecha_valor == fecha_valor,
                    MovimientoModelo.importe == importe,
                    MovimientoModelo.saldo == saldo,
                    MovimientoModelo.descripcion == descripcion,
                )
            )
            is not None
        )

    def existen_movimientos_de_cuenta(self, id_cuenta: int) -> bool:
        return (
            self._sesion.scalar(
                select(MovimientoModelo).where(MovimientoModelo.cuenta_id == id_cuenta)
            )
            is not None
        )

    def existen_movimientos_de_categoria(self, id_categoria: int) -> bool:
        return (
            self._sesion.scalar(
                select(MovimientoModelo).where(MovimientoModelo.categoria_id == id_categoria)
            )
            is not None
        )

    def existen_movimientos_de_subcategoria(self, id_subcategoria: int) -> bool:
        return (
            self._sesion.scalar(
                select(MovimientoModelo).where(MovimientoModelo.subcategoria_id == id_subcategoria)
            )
            is not None
        )
