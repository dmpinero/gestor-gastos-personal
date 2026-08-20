from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas
from gestor_gastos.dominio.importacion.lector_excel import LectorExcel
from gestor_gastos.dominio.importacion.valores import FilaMovimientoExcel, ResumenImportacion
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class ImportarMovimientosExcel:
    """Orquesta la lectura de un Excel de movimientos y su alta en el sistema.

    Crea la cuenta si no existe, crea las categorías/subcategorías nuevas que
    aparezcan, y omite (sin duplicar) los movimientos que ya existan.
    """

    def __init__(
        self,
        repositorio_cuentas: RepositorioCuentas,
        repositorio_categorias: RepositorioCategorias,
        repositorio_movimientos: RepositorioMovimientos,
        lector: LectorExcel,
    ) -> None:
        self._cuentas = repositorio_cuentas
        self._categorias = repositorio_categorias
        self._movimientos = repositorio_movimientos
        self._lector = lector

    def ejecutar(self, contenido: bytes, nombre_fichero: str) -> ResumenImportacion:
        datos = self._lector.leer(contenido, nombre_fichero)

        cuenta = self._obtener_o_crear_cuenta(datos.cabecera.numero_cuenta, datos.cabecera.titular)

        resumen = ResumenImportacion(cuenta_id=cuenta.id)
        cache_categorias: dict[str, Categoria] = {}
        cache_subcategorias: dict[tuple[int, str], Subcategoria] = {}

        for fila in datos.filas:
            categoria = self._obtener_o_crear_categoria(fila.categoria, cache_categorias, resumen)
            subcategoria = None
            if fila.subcategoria:
                subcategoria = self._obtener_o_crear_subcategoria(
                    categoria.id, fila.subcategoria, cache_subcategorias, resumen
                )

            if self._movimientos.existe_duplicado(
                cuenta.id, fila.fecha_valor, fila.importe, fila.saldo, fila.descripcion
            ):
                resumen.movimientos_omitidos_por_duplicado += 1
                continue

            nuevo_movimiento = self._construir_movimiento(cuenta.id, categoria, subcategoria, fila)
            self._movimientos.crear(nuevo_movimiento)
            resumen.movimientos_importados += 1

        return resumen

    def _obtener_o_crear_cuenta(self, numero_cuenta: str, titular: str | None) -> CuentaBancaria:
        cuenta = self._cuentas.obtener_por_numero_cuenta(numero_cuenta)
        if cuenta is not None:
            return cuenta
        # El alias es el mismo dato que el titular (celda D2 del Excel); la
        # moneda no viene en el fichero y siempre es euros.
        return self._cuentas.crear(
            CuentaBancaria(
                numero_cuenta=numero_cuenta,
                titular=titular,
                alias=titular,
                moneda="€",
            )
        )

    def _obtener_o_crear_categoria(
        self,
        nombre: str,
        cache: dict[str, Categoria],
        resumen: ResumenImportacion,
    ) -> Categoria:
        if nombre in cache:
            return cache[nombre]

        categoria = self._categorias.obtener_categoria_por_nombre(nombre)
        if categoria is None:
            categoria = self._categorias.crear_categoria(Categoria(nombre=nombre))
            resumen.categorias_creadas.append(nombre)

        cache[nombre] = categoria
        return categoria

    def _obtener_o_crear_subcategoria(
        self,
        id_categoria: int,
        nombre: str,
        cache: dict[tuple[int, str], Subcategoria],
        resumen: ResumenImportacion,
    ) -> Subcategoria:
        clave = (id_categoria, nombre)
        if clave in cache:
            return cache[clave]

        subcategoria = self._categorias.obtener_subcategoria_por_nombre(id_categoria, nombre)
        if subcategoria is None:
            subcategoria = self._categorias.crear_subcategoria(
                Subcategoria(nombre=nombre, categoria_id=id_categoria)
            )
            resumen.subcategorias_creadas.append(nombre)

        cache[clave] = subcategoria
        return subcategoria

    def _construir_movimiento(
        self,
        id_cuenta: int,
        categoria: Categoria,
        subcategoria: Subcategoria | None,
        fila: FilaMovimientoExcel,
    ) -> Movimiento:
        return Movimiento(
            cuenta_id=id_cuenta,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id if subcategoria else None,
            fecha_valor=fila.fecha_valor,
            descripcion=fila.descripcion,
            comentario=fila.comentario,
            importe=fila.importe,
            saldo=fila.saldo,
        )
