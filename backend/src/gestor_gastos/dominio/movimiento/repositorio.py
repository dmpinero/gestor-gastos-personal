import datetime
from decimal import Decimal
from typing import Protocol

from gestor_gastos.dominio.movimiento.entidades import Movimiento


class RepositorioMovimientos(Protocol):
    """Puerto de persistencia para Movimiento."""

    def crear(self, movimiento: Movimiento) -> Movimiento: ...

    def obtener_por_id(self, id_movimiento: int) -> Movimiento | None: ...

    def listar_todos(self) -> list[Movimiento]: ...

    def listar_por_cuenta(self, id_cuenta: int) -> list[Movimiento]: ...

    def listar_por_categoria(
        self, id_categoria: int, solo_gastos: bool = False
    ) -> list[Movimiento]: ...

    def listar_por_subcategoria(
        self, id_subcategoria: int, solo_gastos: bool = False
    ) -> list[Movimiento]: ...

    def actualizar(self, movimiento: Movimiento) -> Movimiento: ...

    def eliminar(self, id_movimiento: int) -> None: ...

    def buscar_duplicado(
        self,
        id_cuenta: int,
        fecha_valor: datetime.date,
        importe: Decimal,
        saldo: Decimal,
        descripcion: str,
    ) -> Movimiento | None: ...

    def contar_movimientos_por_cuenta(self, id_cuenta: int) -> int: ...

    def contar_movimientos_por_categoria(self, id_categoria: int) -> int: ...

    def contar_movimientos_por_subcategoria(self, id_subcategoria: int) -> int: ...

    def eliminar_movimientos_por_cuenta(self, id_cuenta: int) -> None: ...

    def eliminar_movimientos_por_categoria(self, id_categoria: int) -> None: ...

    def eliminar_movimientos_por_subcategoria(self, id_subcategoria: int) -> None: ...

    def actualizar_categoria_de_movimientos_por_subcategoria(
        self, id_subcategoria: int, id_categoria: int
    ) -> None: ...

    def obtener_ultimo_saldo(self, id_cuenta: int) -> Decimal | None: ...

    def sumar_gastos_por_categoria(self) -> dict[int, Decimal]: ...

    def sumar_ingresos_por_categoria(self) -> dict[int, Decimal]: ...

    def sumar_movimientos_por_mes(
        self, anio: int
    ) -> dict[tuple[int, int | None, int], Decimal]: ...

    def listar_ids_e_importes_por_descripcion_y_mes(
        self,
        anio: int,
        fragmento_descripcion: str,
        categoria_excluida: int,
        subcategoria_excluida: int | None,
    ) -> dict[int, dict[int, Decimal]]:
        """Agrupa por mes los movimientos de ese año cuya descripción
        contiene `fragmento_descripcion` (sin distinguir mayúsculas/
        minúsculas), EXCLUYENDO los que ya pertenecen a
        categoria_excluida/subcategoria_excluida: quien llama combina este
        resultado con el de esa categoría/subcategoría (ver
        sumar_movimientos_por_mes), y sin esta exclusión un movimiento que
        coincidiera con ambos criterios se contaría dos veces.

        Devuelve, por mes, un diccionario {id_movimiento: importe} en vez de
        la suma ya hecha: un concepto puede tener varias asociaciones por
        descripción cuyo texto se solape (p.ej. una genérica y otra más
        específica que coincida con los mismos movimientos), y quien llama
        necesita poder unir los resultados de varias asociaciones por id de
        movimiento antes de sumar, para no contar el mismo movimiento dos
        veces."""
        ...

    def listar_por_categoria_y_mes(
        self, id_categoria: int, id_subcategoria: int | None, anio: int, mes: int
    ) -> list[Movimiento]:
        """Mismo filtro que `sumar_movimientos_por_mes`, pero devolviendo los
        movimientos en vez de su suma."""
        ...

    def listar_por_descripcion_y_mes(
        self, fragmento_descripcion: str, anio: int, mes: int
    ) -> list[Movimiento]:
        """Mismo filtro que `listar_ids_e_importes_por_descripcion_y_mes`,
        pero devolviendo los movimientos completos de un único mes en vez de
        agrupados por mes."""
        ...

    def listar_por_descripcion(self, fragmento_descripcion: str) -> list[Movimiento]:
        """Como `listar_por_descripcion_y_mes`, pero de cualquier fecha (sin
        restringir a un año/mes concreto): lo usa Historial, que muestra
        todos los movimientos de una categoría/subcategoría sin acotar a un
        periodo."""
        ...
