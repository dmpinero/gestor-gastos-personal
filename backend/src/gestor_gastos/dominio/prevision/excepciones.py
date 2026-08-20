class HojaExcelNoReconocidaError(Exception):
    """Se lanza cuando el Excel de Resumen anual no tiene las hojas
    "Gastos"/"Ingresos" esperadas (formato generado por la propia app)."""


class FicheroSinConceptosPrevistosError(Exception):
    """Se lanza cuando el Excel de conceptos previstos tiene cabecera pero
    ninguna fila de datos."""


class PeriodicidadNoReconocidaError(Exception):
    """Se lanza cuando la columna Periodicidad de una fila no es uno de los
    valores válidos: mensual, trimestral, semestral, anual."""


class ImportePrevistoInvalidoError(Exception):
    """Se lanza cuando la columna Importe previsto de una fila está vacía o
    no es un número."""
