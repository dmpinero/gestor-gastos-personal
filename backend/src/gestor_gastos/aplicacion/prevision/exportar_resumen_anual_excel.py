from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.dominio.prevision.escritor_excel_resumen_anual import EscritorExcelResumenAnual


class ExportarResumenAnualExcel:
    def __init__(
        self,
        obtener_resumen_anual: ObtenerResumenAnual,
        escritor: EscritorExcelResumenAnual,
    ) -> None:
        self._obtener_resumen_anual = obtener_resumen_anual
        self._escritor = escritor

    def ejecutar(self, anio: int) -> bytes:
        resumen = self._obtener_resumen_anual.ejecutar(anio)
        return self._escritor.escribir(resumen)
