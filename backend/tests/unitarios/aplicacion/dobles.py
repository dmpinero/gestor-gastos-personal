import datetime
from collections.abc import Callable
from decimal import Decimal

from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.importacion.valores import DatosExcelLeidos
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto


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

    def contar_subcategorias(self, id_categoria: int) -> int:
        return sum(1 for s in self._subcategorias.values() if s.categoria_id == id_categoria)

    def eliminar_subcategorias_de(self, id_categoria: int) -> None:
        ids = [s.id for s in self._subcategorias.values() if s.categoria_id == id_categoria]
        for id_subcategoria in ids:
            self._subcategorias.pop(id_subcategoria, None)

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

    def listar_por_categoria(
        self, id_categoria: int, solo_gastos: bool = False
    ) -> list[Movimiento]:
        movimientos = [
            m
            for m in self._movimientos.values()
            if m.categoria_id == id_categoria and (not solo_gastos or m.importe < 0)
        ]
        return sorted(movimientos, key=lambda m: m.fecha_valor, reverse=True)

    def actualizar_categoria_de_movimientos_por_subcategoria(
        self, id_subcategoria: int, id_categoria: int
    ) -> None:
        for movimiento in self._movimientos.values():
            if movimiento.subcategoria_id == id_subcategoria:
                movimiento.categoria_id = id_categoria

    def listar_por_subcategoria(
        self, id_subcategoria: int, solo_gastos: bool = False
    ) -> list[Movimiento]:
        movimientos = [
            m
            for m in self._movimientos.values()
            if m.subcategoria_id == id_subcategoria and (not solo_gastos or m.importe < 0)
        ]
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

    def contar_movimientos_por_cuenta(self, id_cuenta: int) -> int:
        return sum(1 for m in self._movimientos.values() if m.cuenta_id == id_cuenta)

    def contar_movimientos_por_categoria(self, id_categoria: int) -> int:
        return sum(1 for m in self._movimientos.values() if m.categoria_id == id_categoria)

    def contar_movimientos_por_subcategoria(self, id_subcategoria: int) -> int:
        return sum(1 for m in self._movimientos.values() if m.subcategoria_id == id_subcategoria)

    def eliminar_movimientos_por_cuenta(self, id_cuenta: int) -> None:
        ids = [m.id for m in self._movimientos.values() if m.cuenta_id == id_cuenta]
        for id_movimiento in ids:
            self._movimientos.pop(id_movimiento, None)

    def eliminar_movimientos_por_categoria(self, id_categoria: int) -> None:
        ids = [m.id for m in self._movimientos.values() if m.categoria_id == id_categoria]
        for id_movimiento in ids:
            self._movimientos.pop(id_movimiento, None)

    def eliminar_movimientos_por_subcategoria(self, id_subcategoria: int) -> None:
        ids = [m.id for m in self._movimientos.values() if m.subcategoria_id == id_subcategoria]
        for id_movimiento in ids:
            self._movimientos.pop(id_movimiento, None)

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

    def sumar_movimientos_por_mes(self, anio: int) -> dict[tuple[int, int | None, int], Decimal]:
        totales: dict[tuple[int, int | None, int], Decimal] = {}
        for movimiento in self._movimientos.values():
            if movimiento.fecha_valor.year != anio:
                continue
            clave = (
                movimiento.categoria_id,
                movimiento.subcategoria_id,
                movimiento.fecha_valor.month,
            )
            totales[clave] = totales.get(clave, Decimal("0")) + movimiento.importe
        return totales


class RepositorioPrevisionesFalso:
    """Doble de RepositorioPrevisiones en memoria."""

    def __init__(self) -> None:
        self._conceptos: dict[int, ConceptoPrevisto] = {}
        self._siguiente_id = 1

    def crear(self, concepto: ConceptoPrevisto) -> ConceptoPrevisto:
        concepto.id = self._siguiente_id
        self._conceptos[concepto.id] = concepto
        self._siguiente_id += 1
        return concepto

    def obtener_por_id(self, id_concepto: int) -> ConceptoPrevisto | None:
        return self._conceptos.get(id_concepto)

    def listar(self) -> list[ConceptoPrevisto]:
        return list(self._conceptos.values())

    def actualizar(self, concepto: ConceptoPrevisto) -> ConceptoPrevisto:
        self._conceptos[concepto.id] = concepto
        return concepto

    def eliminar(self, id_concepto: int) -> None:
        self._conceptos.pop(id_concepto, None)


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
