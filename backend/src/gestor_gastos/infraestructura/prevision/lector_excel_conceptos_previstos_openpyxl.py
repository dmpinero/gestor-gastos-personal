import io
from decimal import Decimal

import openpyxl

from gestor_gastos.dominio.importacion.excepciones import ExtensionNoSoportadaError
from gestor_gastos.dominio.prevision.excepciones import (
    FicheroSinConceptosPrevistosError,
    ImportePrevistoInvalidoError,
    PeriodicidadNoReconocidaError,
)
from gestor_gastos.dominio.prevision.valores import (
    DatosConceptosPrevistosExcelLeidos,
    FilaConceptoPrevistoExcel,
)

_EXTENSIONES_SOPORTADAS = {".xlsx"}
_PERIODICIDADES_VALIDAS = {"mensual", "trimestral", "semestral", "anual"}
_COLUMNA_CATEGORIA, _COLUMNA_SUBCATEGORIA, _COLUMNA_PERIODICIDAD, _COLUMNA_IMPORTE = range(4)


class LectorExcelConceptosPrevistosOpenpyxl:
    """Adaptador de LectorExcelConceptosPrevistos para el formato propio de
    alta masiva de conceptos previstos: A=Categoría, B=Subcategoría
    (opcional), C=Periodicidad, D=Importe previsto. Fila 1 = cabecera."""

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosConceptosPrevistosExcelLeidos:
        extension = self._extraer_extension(nombre_fichero)
        if extension not in _EXTENSIONES_SOPORTADAS:
            raise ExtensionNoSoportadaError(
                f"Extensión '{extension}' no soportada; solo se admite .xlsx"
            )

        libro = openpyxl.load_workbook(io.BytesIO(contenido), data_only=True)
        hoja = libro.worksheets[0]

        filas: list[FilaConceptoPrevistoExcel] = []
        for numero_fila, fila in enumerate(hoja.iter_rows(min_row=2), start=2):
            categoria = self._texto_o_none(fila[_COLUMNA_CATEGORIA].value)
            if categoria is None:
                break  # fin de los datos, igual que el lector de movimientos

            periodicidad_bruta = self._texto_o_none(fila[_COLUMNA_PERIODICIDAD].value)
            periodicidad = (periodicidad_bruta or "").lower()
            if periodicidad not in _PERIODICIDADES_VALIDAS:
                raise PeriodicidadNoReconocidaError(
                    f"Periodicidad '{periodicidad_bruta}' no reconocida en la fila {numero_fila}"
                )

            importe_previsto = self._leer_importe(fila[_COLUMNA_IMPORTE].value, numero_fila)

            filas.append(
                FilaConceptoPrevistoExcel(
                    categoria=categoria,
                    subcategoria=self._texto_o_none(fila[_COLUMNA_SUBCATEGORIA].value),
                    periodicidad=periodicidad,
                    importe_previsto=importe_previsto,
                )
            )

        if not filas:
            raise FicheroSinConceptosPrevistosError(
                "El fichero no contiene ninguna fila de conceptos previstos"
            )

        return DatosConceptosPrevistosExcelLeidos(filas=filas)

    def _extraer_extension(self, nombre_fichero: str) -> str:
        punto = nombre_fichero.rfind(".")
        return nombre_fichero[punto:].lower() if punto != -1 else ""

    def _texto_o_none(self, valor: object) -> str | None:
        if valor is None:
            return None
        texto = str(valor).strip()
        return texto or None

    def _leer_importe(self, valor: object, numero_fila: int) -> Decimal:
        if valor is None:
            raise ImportePrevistoInvalidoError(f"Importe previsto vacío en la fila {numero_fila}")
        try:
            return Decimal(str(round(float(valor), 2)))
        except (TypeError, ValueError) as error:
            raise ImportePrevistoInvalidoError(
                f"Importe previsto no numérico en la fila {numero_fila}"
            ) from error
