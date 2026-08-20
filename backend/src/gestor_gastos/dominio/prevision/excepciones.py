class HojaExcelNoReconocidaError(Exception):
    """Se lanza cuando el Excel de Resumen anual no tiene las hojas
    "Gastos"/"Ingresos" esperadas (formato generado por la propia app)."""
