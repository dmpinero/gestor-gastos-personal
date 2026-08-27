from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.dominio.excepciones import FiltroDeListadoInvalidoError
from gestor_gastos.dominio.prevision.escritor_excel_resumen_anual import EscritorExcelResumenAnual


class ExportarResumenAnualExcel:
    def __init__(
        self,
        obtener_resumen_anual: ObtenerResumenAnual,
        escritor: EscritorExcelResumenAnual,
    ) -> None:
        self._obtener_resumen_anual = obtener_resumen_anual
        self._escritor = escritor

    def ejecutar(self, anio_desde: int, anio_hasta: int) -> bytes:
        if anio_hasta < anio_desde:
            raise FiltroDeListadoInvalidoError(
                f"anio_hasta ({anio_hasta}) no puede ser anterior a anio_desde ({anio_desde})"
            )
        resumenes = [
            self._obtener_resumen_anual.ejecutar(anio) for anio in range(anio_desde, anio_hasta + 1)
        ]
        return self._escritor.escribir(resumenes)
