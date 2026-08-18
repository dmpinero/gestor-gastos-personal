import datetime
from collections.abc import Callable
from decimal import Decimal

from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.importacion.valores import DatosExcelLeidos
from gestor_gastos.dominio.movimiento.entidades import Movimiento


class RepositorioCuentasFalso:
    """Doble de RepositorioCuentas en memoria, para tests unitarios de aplicación."""

    def __init__(self) -> None:
        self._cuentas: dict[int, CuentaBancaria] = {}
        self._siguiente_id = 1

    def crear(self, cuenta: CuentaBancaria) -> CuentaBancaria:
        cuenta.id = self._siguiente_id
        self._cuentas[cuenta.id] = cuenta
        self._siguiente_id += 1
        return cuenta

    def obtener_por_id(self, id_cuenta: int) -> CuentaBancaria | None:
        return self._cuentas.get(id_cuenta)

    def obtener_por_numero_cuenta(self, numero_cuenta: str) -> CuentaBancaria | None:
        return next((c for c in self._cuentas.values() if c.numero_cuenta == numero_cuenta), None)

    def listar(self) -> list[CuentaBancaria]:
        return list(self._cuentas.values())

    def actualizar(self, cuenta: CuentaBancaria) -> CuentaBancaria:
        self._cuentas[cuenta.id] = cuenta
        return cuenta

    def eliminar(self, id_cuenta: int) -> None:
        self._cuentas.pop(id_cuenta, None)


class RepositorioCategoriasFalso:
    """Doble de RepositorioCategorias en memoria."""

    def __init__(self) -> None:
        self._categorias: dict[int, Categoria] = {}
        self._subcategorias: dict[int, Subcategoria] = {}
        self._siguiente_id_categoria = 1
        self._siguiente_id_subcategoria = 1

    def crear_categoria(self, categoria: Categoria) -> Categoria:
        categoria.id = self._siguiente_id_categoria
        self._categorias[categoria.id] = categoria
        self._siguiente_id_categoria += 1
        return categoria

    def obtener_categoria_por_id(self, id_categoria: int) -> Categoria | None:
        return self._categorias.get(id_categoria)

    def obtener_categoria_por_nombre(self, nombre: str) -> Categoria | None:
        return next((c for c in self._categorias.values() if c.nombre == nombre), None)

    def listar_categorias(self) -> list[Categoria]:
        return list(self._categorias.values())

    def actualizar_categoria(self, categoria: Categoria) -> Categoria:
        self._categorias[categoria.id] = categoria
        return categoria

    def eliminar_categoria(self, id_categoria: int) -> None:
        self._categorias.pop(id_categoria, None)

    def tiene_subcategorias(self, id_categoria: int) -> bool:
        return any(s.categoria_id == id_categoria for s in self._subcategorias.values())

    def crear_subcategoria(self, subcategoria: Subcategoria) -> Subcategoria:
        subcategoria.id = self._siguiente_id_subcategoria
        self._subcategorias[subcategoria.id] = subcategoria
        self._siguiente_id_subcategoria += 1
        return subcategoria

    def obtener_subcategoria_por_id(self, id_subcategoria: int) -> Subcategoria | None:
        return self._subcategorias.get(id_subcategoria)

    def obtener_subcategoria_por_nombre(
        self, id_categoria: int, nombre: str
    ) -> Subcategoria | None:
        return next(
            (
                s
                for s in self._subcategorias.values()
                if s.categoria_id == id_categoria and s.nombre == nombre
            ),
            None,
        )

    def listar_subcategorias_de(self, id_categoria: int) -> list[Subcategoria]:
        return [s for s in self._subcategorias.values() if s.categoria_id == id_categoria]

    def actualizar_subcategoria(self, subcategoria: Subcategoria) -> Subcategoria:
        self._subcategorias[subcategoria.id] = subcategoria
        return subcategoria

    def eliminar_subcategoria(self, id_subcategoria: int) -> None:
        self._subcategorias.pop(id_subcategoria, None)


class RepositorioMovimientosFalso:
    """Doble de RepositorioMovimientos en memoria."""

    def __init__(self) -> None:
        self._movimientos: dict[int, Movimiento] = {}
        self._siguiente_id = 1

    def crear(self, movimiento: Movimiento) -> Movimiento:
        movimiento.id = self._siguiente_id
        self._movimientos[movimiento.id] = movimiento
        self._siguiente_id += 1
        return movimiento

    def obtener_por_id(self, id_movimiento: int) -> Movimiento | None:
        return self._movimientos.get(id_movimiento)

    def listar_por_cuenta(self, id_cuenta: int) -> list[Movimiento]:
        movimientos = [m for m in self._movimientos.values() if m.cuenta_id == id_cuenta]
        return sorted(movimientos, key=lambda m: m.fecha_valor, reverse=True)

    def actualizar(self, movimiento: Movimiento) -> Movimiento:
        self._movimientos[movimiento.id] = movimiento
        return movimiento

    def eliminar(self, id_movimiento: int) -> None:
        self._movimientos.pop(id_movimiento, None)

    def existe_duplicado(
        self,
        id_cuenta: int,
        fecha_valor: datetime.date,
        importe: Decimal,
        saldo: Decimal,
        descripcion: str,
    ) -> bool:
        return any(
            m.cuenta_id == id_cuenta
            and m.fecha_valor == fecha_valor
            and m.importe == importe
            and m.saldo == saldo
            and m.descripcion == descripcion
            for m in self._movimientos.values()
        )

    def existen_movimientos_de_cuenta(self, id_cuenta: int) -> bool:
        return any(m.cuenta_id == id_cuenta for m in self._movimientos.values())

    def existen_movimientos_de_categoria(self, id_categoria: int) -> bool:
        return any(m.categoria_id == id_categoria for m in self._movimientos.values())

    def existen_movimientos_de_subcategoria(self, id_subcategoria: int) -> bool:
        return any(m.subcategoria_id == id_subcategoria for m in self._movimientos.values())

    def obtener_ultimo_saldo(self, id_cuenta: int) -> Decimal | None:
        movimientos = [m for m in self._movimientos.values() if m.cuenta_id == id_cuenta]
        if not movimientos:
            return None
        ultimo = max(movimientos, key=lambda m: (m.fecha_valor, m.id))
        return ultimo.saldo

    def sumar_gastos_por_categoria(self) -> dict[int, Decimal]:
        return self._sumar_por_categoria(lambda importe: importe < 0)

    def sumar_ingresos_por_categoria(self) -> dict[int, Decimal]:
        return self._sumar_por_categoria(lambda importe: importe > 0)

    def _sumar_por_categoria(self, incluir: Callable[[Decimal], bool]) -> dict[int, Decimal]:
        totales: dict[int, Decimal] = {}
        for movimiento in self._movimientos.values():
            if incluir(movimiento.importe):
                totales[movimiento.categoria_id] = (
                    totales.get(movimiento.categoria_id, Decimal("0")) + movimiento.importe
                )
        return totales


class LectorExcelFalso:
    """Doble de LectorExcel que devuelve unos datos fijos o lanza un error dado."""

    def __init__(
        self, datos: DatosExcelLeidos | None = None, error: Exception | None = None
    ) -> None:
        self._datos = datos
        self._error = error

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosExcelLeidos:
        if self._error is not None:
            raise self._error
        assert self._datos is not None
        return self._datos
