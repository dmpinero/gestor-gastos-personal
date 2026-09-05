from collections.abc import Iterator

from gestor_gastos.aplicacion.prevision.normalizar_descripcion_asociacion import (
    normalizar_descripcion_asociacion,
)
from gestor_gastos.dominio.categoria.entidades import Categoria
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas
from gestor_gastos.dominio.importacion.lector_pdf import LectorPdf
from gestor_gastos.dominio.importacion.valores import (
    DatosPdfLeidos,
    DuplicadoDetectado,
    EventoProgreso,
    FilaMovimientoExcel,
    FilaMovimientoPdf,
    ResumenImportacion,
)
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.entidades import AsociacionDescripcion
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociacionesDescripcion

NOMBRE_CATEGORIA_SIN_CATEGORIZAR = "Sin categorizar"
ORIGEN_PDF = "pdf"

_AsociacionConFragmento = tuple[str, AsociacionDescripcion]


class ImportarMovimientosPdf:
    """Como ImportarMovimientosExcel, pero para el certificado de movimientos
    en PDF: al no traer categoría ni subcategoría, se resuelven por
    asociación de descripción (las mismas que ya usan Resumen anual e
    Historial); si ninguna coincide, el movimiento se deja en la categoría
    "Sin categorizar" para revisarlo manualmente más tarde.
    """

    def __init__(
        self,
        repositorio_cuentas: RepositorioCuentas,
        repositorio_categorias: RepositorioCategorias,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_asociaciones_descripcion: RepositorioAsociacionesDescripcion,
        lector: LectorPdf,
    ) -> None:
        self._cuentas = repositorio_cuentas
        self._categorias = repositorio_categorias
        self._movimientos = repositorio_movimientos
        self._asociaciones_descripcion = repositorio_asociaciones_descripcion
        self._lector = lector

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosPdfLeidos:
        """Solo parsea el fichero; no toca la base de datos (ver
        ImportarMovimientosExcel.leer)."""
        return self._lector.leer(contenido, nombre_fichero)

    def ejecutar(self, datos: DatosPdfLeidos) -> Iterator[EventoProgreso | ResumenImportacion]:
        """Generador: emite un EventoProgreso tras procesar cada fila y, al
        terminar, el ResumenImportacion final (siempre el último elemento)."""
        cuenta = self._obtener_o_crear_cuenta(datos.cabecera.numero_cuenta, datos.cabecera.titular)
        asociaciones = self._cargar_asociaciones_normalizadas()

        resumen = ResumenImportacion(cuenta_id=cuenta.id)
        cache_categorias: dict[int, Categoria | None] = {}
        categoria_sin_categorizar: Categoria | None = None
        total = len(datos.filas)

        for indice, fila in enumerate(datos.filas, start=1):
            categoria_id, subcategoria_id = self._resolver_asociacion(
                fila.descripcion, asociaciones
            )
            if categoria_id is None:
                if categoria_sin_categorizar is None:
                    categoria_sin_categorizar = self._obtener_o_crear_categoria_sin_categorizar(
                        resumen
                    )
                categoria_id, subcategoria_id = categoria_sin_categorizar.id, None

            duplicado = self._movimientos.buscar_duplicado(
                cuenta.id, fila.fecha_valor, fila.importe, fila.saldo, fila.descripcion
            )
            if duplicado is not None:
                resumen.movimientos_omitidos_por_duplicado += 1
                resumen.duplicados.append(
                    DuplicadoDetectado(
                        fila_excel=self._como_fila_excel(
                            fila, categoria_id, subcategoria_id, cache_categorias
                        ),
                        movimiento_existente=duplicado,
                    )
                )
            else:
                self._movimientos.crear(
                    Movimiento(
                        cuenta_id=cuenta.id,
                        categoria_id=categoria_id,
                        subcategoria_id=subcategoria_id,
                        fecha_valor=fila.fecha_valor,
                        descripcion=fila.descripcion,
                        importe=fila.importe,
                        saldo=fila.saldo,
                        origen=ORIGEN_PDF,
                    )
                )
                resumen.movimientos_importados += 1

            yield EventoProgreso(procesadas=indice, total=total)

        yield resumen

    def _obtener_o_crear_cuenta(self, numero_cuenta: str, titular: str | None) -> CuentaBancaria:
        # El PDF y el Excel del banco pueden agrupar los espacios del número
        # de cuenta de forma distinta (p.ej. "1465 0100 96 1705727894" frente
        # a "1465 0100 9617 05727894" para la misma cuenta): se compara sin
        # espacios para reconocer la cuenta ya existente en vez de duplicarla.
        normalizado = numero_cuenta.replace(" ", "")
        for cuenta in self._cuentas.listar():
            if cuenta.numero_cuenta.replace(" ", "") == normalizado:
                return cuenta
        return self._cuentas.crear(
            CuentaBancaria(
                numero_cuenta=numero_cuenta,
                titular=titular,
                alias=titular,
                moneda="€",
            )
        )

    def _cargar_asociaciones_normalizadas(self) -> list[_AsociacionConFragmento]:
        return [
            (normalizar_descripcion_asociacion(a.descripcion).lower(), a)
            for a in self._asociaciones_descripcion.listar()
        ]

    def _resolver_asociacion(
        self, descripcion: str, asociaciones: list[_AsociacionConFragmento]
    ) -> tuple[int | None, int | None]:
        descripcion_normalizada = normalizar_descripcion_asociacion(descripcion).lower()
        candidatas = [
            asociacion
            for fragmento, asociacion in asociaciones
            if fragmento in descripcion_normalizada
        ]
        if not candidatas:
            return None, None
        # Si varias asociaciones coinciden, se usa la más específica (el
        # fragmento más largo) para desempatar sin ambigüedad.
        mejor = max(candidatas, key=lambda a: len(a.descripcion))
        return mejor.categoria_resumen_id, mejor.subcategoria_resumen_id

    def _obtener_o_crear_categoria_sin_categorizar(self, resumen: ResumenImportacion) -> Categoria:
        categoria = self._categorias.obtener_categoria_por_nombre(NOMBRE_CATEGORIA_SIN_CATEGORIZAR)
        if categoria is None:
            categoria = self._categorias.crear_categoria(
                Categoria(nombre=NOMBRE_CATEGORIA_SIN_CATEGORIZAR)
            )
            resumen.categorias_creadas.append(NOMBRE_CATEGORIA_SIN_CATEGORIZAR)
        return categoria

    def _como_fila_excel(
        self,
        fila: FilaMovimientoPdf,
        categoria_id: int,
        subcategoria_id: int | None,
        cache_categorias: dict[int, Categoria | None],
    ) -> FilaMovimientoExcel:
        """Reporta la fila del PDF con la misma forma que una fila de Excel
        (con la categoría/subcategoría ya resueltas), para que la modal de
        comparación de duplicados del frontend la muestre sin cambios."""
        if categoria_id not in cache_categorias:
            cache_categorias[categoria_id] = self._categorias.obtener_categoria_por_id(categoria_id)
        categoria = cache_categorias[categoria_id]
        subcategoria = (
            self._categorias.obtener_subcategoria_por_id(subcategoria_id)
            if subcategoria_id is not None
            else None
        )
        return FilaMovimientoExcel(
            fecha_valor=fila.fecha_valor,
            categoria=categoria.nombre if categoria else "",
            subcategoria=subcategoria.nombre if subcategoria else None,
            descripcion=fila.descripcion,
            comentario=None,
            importe=fila.importe,
            saldo=fila.saldo,
        )
