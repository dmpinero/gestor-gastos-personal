from decimal import Decimal

from gestor_gastos.aplicacion.prevision.ajustar_valor_mensual import AjustarValorMensual
from gestor_gastos.aplicacion.prevision.eliminar_ajuste_mensual import EliminarAjusteMensual
from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.dominio.prevision.lector_excel_resumen_anual import LectorExcelResumenAnual
from gestor_gastos.dominio.prevision.valores import (
    OrigenValorMensual,
    ResumenAnual,
    ResumenImportacionResumenAnual,
)


class ImportarResumenAnualExcel:
    """Importa un Excel de Resumen anual (generado por ExportarResumenAnualExcel,
    posiblemente editado a mano) y aplica como ajustes solo las celdas que
    hayan cambiado respecto al valor actual.

    Reimportar el mismo fichero sin tocar nada no tiene ningún efecto: solo
    se actualiza una celda si su importe difiere del real/previsto/ajustado
    actual. Una celda vacía revierte un ajuste existente (igual que vaciarla
    a mano en la app); si no había ajuste, no hace nada. Los conceptos que
    ya no existen se cuentan pero no crean nada nuevo.
    """

    def __init__(
        self,
        lector: LectorExcelResumenAnual,
        obtener_resumen_anual: ObtenerResumenAnual,
        ajustar_valor_mensual: AjustarValorMensual,
        eliminar_ajuste_mensual: EliminarAjusteMensual,
    ) -> None:
        self._lector = lector
        self._obtener_resumen_anual = obtener_resumen_anual
        self._ajustar = ajustar_valor_mensual
        self._eliminar_ajuste = eliminar_ajuste_mensual

    def ejecutar(
        self, contenido: bytes, nombre_fichero: str, anio: int
    ) -> ResumenImportacionResumenAnual:
        datos = self._lector.leer(contenido, nombre_fichero)
        valores_actuales = self._indexar_valores_actuales(
            self._obtener_resumen_anual.ejecutar(anio)
        )

        celdas_actualizadas = 0
        celdas_eliminadas = 0
        conceptos_no_encontrados: set[int] = set()

        for celda in datos.celdas:
            actual = valores_actuales.get((celda.concepto_id, celda.mes))
            if actual is None:
                conceptos_no_encontrados.add(celda.concepto_id)
                continue
            importe_actual, origen_actual = actual

            if celda.importe is None:
                if origen_actual == "ajustado":
                    self._eliminar_ajuste.ejecutar(celda.concepto_id, anio, celda.mes)
                    celdas_eliminadas += 1
                continue

            if celda.importe != importe_actual:
                self._ajustar.ejecutar(celda.concepto_id, anio, celda.mes, celda.importe)
                celdas_actualizadas += 1

        return ResumenImportacionResumenAnual(
            celdas_actualizadas=celdas_actualizadas,
            celdas_eliminadas=celdas_eliminadas,
            conceptos_no_encontrados=len(conceptos_no_encontrados),
        )

    def _indexar_valores_actuales(
        self, resumen: ResumenAnual
    ) -> dict[tuple[int, int], tuple[Decimal, OrigenValorMensual]]:
        indice: dict[tuple[int, int], tuple[Decimal, OrigenValorMensual]] = {}
        for fila in (*resumen.filas_gastos, *resumen.filas_ingresos):
            for valor in fila.valores:
                indice[(fila.concepto_id, valor.mes)] = (valor.importe, valor.origen)
        return indice
