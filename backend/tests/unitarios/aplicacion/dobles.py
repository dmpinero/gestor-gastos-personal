import datetime
from collections.abc import Callable
from decimal import Decimal

from gestor_gastos.aplicacion.prevision.normalizar_descripcion_asociacion import (
    normalizar_descripcion_asociacion,
)
from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.importacion.valores import DatosExcelLeidos, DatosPdfLeidos
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.prevision.entidades import (
    AjusteMensual,
    AsociacionConcepto,
    AsociacionDescripcion,
    ConceptoPrevisto,
)
from gestor_gastos.dominio.prevision.valores import (
    DatosConceptosPrevistosExcelLeidos,
    DatosResumenAnualExcelLeidos,
)


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

    def listar_todos(self) -> list[Movimiento]:
        return sorted(self._movimientos.values(), key=lambda m: m.fecha_valor, reverse=True)

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

    def buscar_duplicado(
        self,
        id_cuenta: int,
        fecha_valor: datetime.date,
        importe: Decimal,
        saldo: Decimal,
        descripcion: str,
    ) -> Movimiento | None:
        descripcion_normalizada = normalizar_descripcion_asociacion(descripcion)
        return next(
            (
                m
                for m in self._movimientos.values()
                if m.cuenta_id == id_cuenta
                and m.fecha_valor == fecha_valor
                and m.importe == importe
                and m.saldo == saldo
                and normalizar_descripcion_asociacion(m.descripcion) == descripcion_normalizada
            ),
            None,
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
        # Ver el comentario en RepositorioMovimientosSqlAlchemy.obtener_ultimo_saldo:
        # con fecha_valor empatada, gana el id más bajo (el banco lista cada
        # día del más reciente al más antiguo).
        movimientos = [m for m in self._movimientos.values() if m.cuenta_id == id_cuenta]
        if not movimientos:
            return None
        fecha_maxima = max(m.fecha_valor for m in movimientos)
        candidatos = [m for m in movimientos if m.fecha_valor == fecha_maxima]
        ultimo = min(candidatos, key=lambda m: m.id)
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

    def listar_ids_e_importes_por_descripcion_y_mes(
        self,
        anio: int,
        fragmento_descripcion: str,
        categoria_excluida: int,
        subcategoria_excluida: int | None,
    ) -> dict[int, dict[int, Decimal]]:
        resultado: dict[int, dict[int, Decimal]] = {}
        for movimiento in self._movimientos.values():
            if movimiento.fecha_valor.year != anio:
                continue
            if fragmento_descripcion.lower() not in movimiento.descripcion.lower():
                continue
            if (
                movimiento.categoria_id == categoria_excluida
                and movimiento.subcategoria_id == subcategoria_excluida
            ):
                continue
            mes = movimiento.fecha_valor.month
            resultado.setdefault(mes, {})[movimiento.id] = movimiento.importe
        return resultado

    def listar_por_categoria_y_mes(
        self, id_categoria: int, id_subcategoria: int | None, anio: int, mes: int
    ) -> list[Movimiento]:
        movimientos = [
            m
            for m in self._movimientos.values()
            if m.categoria_id == id_categoria
            and m.subcategoria_id == id_subcategoria
            and m.fecha_valor.year == anio
            and m.fecha_valor.month == mes
        ]
        return sorted(movimientos, key=lambda m: m.fecha_valor, reverse=True)

    def listar_por_descripcion_y_mes(
        self, fragmento_descripcion: str, anio: int, mes: int
    ) -> list[Movimiento]:
        movimientos = [
            m
            for m in self._movimientos.values()
            if fragmento_descripcion.lower() in m.descripcion.lower()
            and m.fecha_valor.year == anio
            and m.fecha_valor.month == mes
        ]
        return sorted(movimientos, key=lambda m: m.fecha_valor, reverse=True)

    def listar_por_descripcion(self, fragmento_descripcion: str) -> list[Movimiento]:
        movimientos = [
            m
            for m in self._movimientos.values()
            if fragmento_descripcion.lower() in m.descripcion.lower()
        ]
        return sorted(movimientos, key=lambda m: m.fecha_valor, reverse=True)


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

    def contar_por_categoria(self, id_categoria: int) -> int:
        return sum(1 for c in self._conceptos.values() if c.categoria_id == id_categoria)

    def contar_por_subcategoria(self, id_subcategoria: int) -> int:
        return sum(1 for c in self._conceptos.values() if c.subcategoria_id == id_subcategoria)

    def eliminar_por_categoria(self, id_categoria: int) -> None:
        for id_concepto in [
            c.id for c in self._conceptos.values() if c.categoria_id == id_categoria
        ]:
            self._conceptos.pop(id_concepto, None)

    def eliminar_por_subcategoria(self, id_subcategoria: int) -> None:
        for id_concepto in [
            c.id for c in self._conceptos.values() if c.subcategoria_id == id_subcategoria
        ]:
            self._conceptos.pop(id_concepto, None)


class RepositorioAjustesPrevisionFalso:
    """Doble de RepositorioAjustesMensuales en memoria."""

    def __init__(self) -> None:
        self._ajustes: dict[tuple[int, int, int], AjusteMensual] = {}
        self._siguiente_id = 1

    def guardar(self, ajuste: AjusteMensual) -> AjusteMensual:
        clave = (ajuste.concepto_id, ajuste.anio, ajuste.mes)
        existente = self._ajustes.get(clave)
        if existente is not None:
            existente.importe = ajuste.importe
            return existente
        ajuste.id = self._siguiente_id
        self._siguiente_id += 1
        self._ajustes[clave] = ajuste
        return ajuste

    def eliminar(self, id_concepto: int, anio: int, mes: int) -> None:
        self._ajustes.pop((id_concepto, anio, mes), None)

    def listar_por_anio(self, anio: int) -> list[AjusteMensual]:
        return [a for a in self._ajustes.values() if a.anio == anio]

    def listar_todos(self) -> list[AjusteMensual]:
        return list(self._ajustes.values())


class RepositorioAsociacionesFalso:
    """Doble de RepositorioAsociaciones en memoria."""

    def __init__(self) -> None:
        self._asociaciones: dict[int, AsociacionConcepto] = {}
        self._siguiente_id = 1

    def crear(self, asociacion: AsociacionConcepto) -> AsociacionConcepto:
        asociacion.id = self._siguiente_id
        self._asociaciones[asociacion.id] = asociacion
        self._siguiente_id += 1
        return asociacion

    def obtener_por_id(self, id_asociacion: int) -> AsociacionConcepto | None:
        return self._asociaciones.get(id_asociacion)

    def listar(self) -> list[AsociacionConcepto]:
        return list(self._asociaciones.values())

    def obtener_por_categoria_resumen(
        self, categoria_resumen_id: int, subcategoria_resumen_id: int | None
    ) -> AsociacionConcepto | None:
        for a in self._asociaciones.values():
            if (
                a.categoria_resumen_id == categoria_resumen_id
                and a.subcategoria_resumen_id == subcategoria_resumen_id
            ):
                return a
        return None

    def actualizar(self, asociacion: AsociacionConcepto) -> AsociacionConcepto:
        self._asociaciones[asociacion.id] = asociacion
        return asociacion

    def eliminar(self, id_asociacion: int) -> None:
        self._asociaciones.pop(id_asociacion, None)

    def contar_por_categoria(self, id_categoria: int) -> int:
        return sum(
            1
            for a in self._asociaciones.values()
            if id_categoria in (a.categoria_resumen_id, a.categoria_movimiento_id)
        )

    def contar_por_subcategoria(self, id_subcategoria: int) -> int:
        return sum(
            1
            for a in self._asociaciones.values()
            if id_subcategoria in (a.subcategoria_resumen_id, a.subcategoria_movimiento_id)
        )

    def eliminar_por_categoria(self, id_categoria: int) -> None:
        for id_asociacion in [
            a.id
            for a in self._asociaciones.values()
            if id_categoria in (a.categoria_resumen_id, a.categoria_movimiento_id)
        ]:
            self._asociaciones.pop(id_asociacion, None)

    def eliminar_por_subcategoria(self, id_subcategoria: int) -> None:
        for id_asociacion in [
            a.id
            for a in self._asociaciones.values()
            if id_subcategoria in (a.subcategoria_resumen_id, a.subcategoria_movimiento_id)
        ]:
            self._asociaciones.pop(id_asociacion, None)


class RepositorioAsociacionesDescripcionFalso:
    """Doble de RepositorioAsociacionesDescripcion en memoria."""

    def __init__(self) -> None:
        self._asociaciones: dict[int, AsociacionDescripcion] = {}
        self._siguiente_id = 1

    def crear(self, asociacion: AsociacionDescripcion) -> AsociacionDescripcion:
        asociacion.id = self._siguiente_id
        self._asociaciones[asociacion.id] = asociacion
        self._siguiente_id += 1
        return asociacion

    def obtener_por_id(self, id_asociacion: int) -> AsociacionDescripcion | None:
        return self._asociaciones.get(id_asociacion)

    def listar(self) -> list[AsociacionDescripcion]:
        return list(self._asociaciones.values())

    def obtener_por_descripcion(self, descripcion: str) -> AsociacionDescripcion | None:
        return next((a for a in self._asociaciones.values() if a.descripcion == descripcion), None)

    def actualizar(self, asociacion: AsociacionDescripcion) -> AsociacionDescripcion:
        self._asociaciones[asociacion.id] = asociacion
        return asociacion

    def eliminar(self, id_asociacion: int) -> None:
        self._asociaciones.pop(id_asociacion, None)

    def contar_por_categoria(self, id_categoria: int) -> int:
        return sum(1 for a in self._asociaciones.values() if a.categoria_resumen_id == id_categoria)

    def contar_por_subcategoria(self, id_subcategoria: int) -> int:
        return sum(
            1 for a in self._asociaciones.values() if a.subcategoria_resumen_id == id_subcategoria
        )

    def eliminar_por_categoria(self, id_categoria: int) -> None:
        for id_asociacion in [
            a.id for a in self._asociaciones.values() if a.categoria_resumen_id == id_categoria
        ]:
            self._asociaciones.pop(id_asociacion, None)

    def eliminar_por_subcategoria(self, id_subcategoria: int) -> None:
        for id_asociacion in [
            a.id
            for a in self._asociaciones.values()
            if a.subcategoria_resumen_id == id_subcategoria
        ]:
            self._asociaciones.pop(id_asociacion, None)


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


class LectorPdfFalso:
    """Doble de LectorPdf que devuelve unos datos fijos o lanza un error dado."""

    def __init__(self, datos: DatosPdfLeidos | None = None, error: Exception | None = None) -> None:
        self._datos = datos
        self._error = error

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosPdfLeidos:
        if self._error is not None:
            raise self._error
        assert self._datos is not None
        return self._datos


class LectorExcelResumenAnualFalso:
    """Doble de LectorExcelResumenAnual que devuelve unos datos fijos o lanza un error dado."""

    def __init__(
        self,
        datos: DatosResumenAnualExcelLeidos | None = None,
        error: Exception | None = None,
    ) -> None:
        self._datos = datos
        self._error = error

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosResumenAnualExcelLeidos:
        if self._error is not None:
            raise self._error
        assert self._datos is not None
        return self._datos


class LectorExcelConceptosPrevistosFalso:
    """Doble de LectorExcelConceptosPrevistos que devuelve datos fijos o lanza un error."""

    def __init__(
        self,
        datos: DatosConceptosPrevistosExcelLeidos | None = None,
        error: Exception | None = None,
    ) -> None:
        self._datos = datos
        self._error = error

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosConceptosPrevistosExcelLeidos:
        if self._error is not None:
            raise self._error
        assert self._datos is not None
        return self._datos


class EscritorExcelResumenAnualFalso:
    """Doble de EscritorExcelResumenAnual que registra los resúmenes recibidos."""

    def __init__(self) -> None:
        self.resumenes_recibidos = None

    def escribir(self, resumenes) -> bytes:
        self.resumenes_recibidos = resumenes
        return b"contenido-falso"


class EscritorExportacionCompletaFalso:
    """Doble de EscritorExportacionCompleta que registra los datos recibidos."""

    def __init__(self) -> None:
        self.datos_recibidos = None

    def escribir(self, datos) -> bytes:
        self.datos_recibidos = datos
        return b"contenido-falso"


class LectorExportacionCompletaFalso:
    """Doble de LectorExportacionCompleta que devuelve unos datos fijos o lanza un error dado."""

    def __init__(self, datos=None, error: Exception | None = None) -> None:
        self._datos = datos
        self._error = error

    def leer(self, contenido: bytes, nombre_fichero: str):
        if self._error is not None:
            raise self._error
        assert self._datos is not None
        return self._datos


class RepositorioImportacionCompletaFalso:
    """Doble de RepositorioImportacionCompleta que registra los datos recibidos."""

    def __init__(self, error: Exception | None = None) -> None:
        self._error = error
        self.datos_recibidos = None

    def reemplazar_todo(self, datos) -> None:
        if self._error is not None:
            raise self._error
        self.datos_recibidos = datos
