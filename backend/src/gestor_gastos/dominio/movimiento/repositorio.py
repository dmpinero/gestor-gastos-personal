import datetime
from decimal import Decimal
from typing import Protocol

from gestor_gastos.dominio.movimiento.entidades import Movimiento


class RepositorioMovimientos(Protocol):
    """Puerto de persistencia para Movimiento."""

    def crear(self, movimiento: Movimiento) -> Movimiento: ...

    def obtener_por_id(self, id_movimiento: int) -> Movimiento | None: ...

    def listar_por_cuenta(self, id_cuenta: int) -> list[Movimiento]: ...

    def actualizar(self, movimiento: Movimiento) -> Movimiento: ...

    def eliminar(self, id_movimiento: int) -> None: ...

    def existe_duplicado(
        self,
        id_cuenta: int,
        fecha_valor: datetime.date,
        importe: Decimal,
        saldo: Decimal,
        descripcion: str,
    ) -> bool: ...

    def existen_movimientos_de_cuenta(self, id_cuenta: int) -> bool: ...

    def existen_movimientos_de_categoria(self, id_categoria: int) -> bool: ...

    def existen_movimientos_de_subcategoria(self, id_subcategoria: int) -> bool: ...
