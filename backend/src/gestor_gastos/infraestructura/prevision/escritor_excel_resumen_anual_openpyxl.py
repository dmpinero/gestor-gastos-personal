import io
from decimal import Decimal

import openpyxl
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE
from openpyxl.styles import Font, PatternFill
from openpyxl.workbook import Workbook

from gestor_gastos.dominio.prevision.valores import FilaResumenAnual, ResumenAnual

_MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

_PRIMERA_COLUMNA_MES = 4  # D

_FUENTE_PREVISTO = Font(italic=True)
_FUENTE_TOTAL = Font(bold=True)
_RELLENO_AJUSTADO = PatternFill(start_color="FFF3CD", end_color="FFF3CD", fill_type="solid")


class EscritorExcelResumenAnualOpenpyxl:
    """Adaptador de EscritorExcelResumenAnual que genera el Excel con openpyxl.

    Formato propio (dos hojas "Gastos"/"Ingresos", columna ID oculta con el
    id del concepto para poder reimportar el fichero de forma fiable).
    """

    def escribir(self, resumen: ResumenAnual) -> bytes:
        libro = openpyxl.Workbook()
        libro.remove(libro.active)
        self._escribir_hoja(libro, "Gastos", resumen.filas_gastos, resumen.totales_gastos)
        self._escribir_hoja(libro, "Ingresos", resumen.filas_ingresos, resumen.totales_ingresos)

        buffer = io.BytesIO()
        libro.save(buffer)
        return buffer.getvalue()

    def _escribir_hoja(
        self,
        libro: Workbook,
        nombre: str,
        filas: list[FilaResumenAnual],
        totales: list[Decimal],
    ) -> None:
        hoja = libro.create_sheet(nombre)
        hoja.append(["ID", "Concepto", "Periodicidad", *_MESES_CORTOS])
        hoja.column_dimensions["A"].hidden = True

        for fila in filas:
            hoja.append(
                [
                    fila.concepto_id,
                    ILLEGAL_CHARACTERS_RE.sub("", fila.nombre),
                    fila.periodicidad,
                    *[v.importe for v in fila.valores],
                ]
            )
            fila_excel = hoja.max_row
            for indice, valor in enumerate(fila.valores):
                celda = hoja.cell(row=fila_excel, column=_PRIMERA_COLUMNA_MES + indice)
                if valor.origen == "previsto":
                    celda.font = _FUENTE_PREVISTO
                elif valor.origen == "ajustado":
                    celda.fill = _RELLENO_AJUSTADO

        hoja.append([None, "Total", None, *totales])
        for celda in hoja[hoja.max_row]:
            celda.font = _FUENTE_TOTAL
