from typing import Protocol

from gestor_gastos.dominio.prevision.valores import DatosResumenAnualExcelLeidos


class LectorExcelResumenAnual(Protocol):
    """Puerto que lee un Excel de Resumen anual (generado por
    EscritorExcelResumenAnual) y extrae sus celdas.

    Debe lanzar ExtensionNoSoportadaError (dominio.importacion.excepciones) o
    HojaExcelNoReconocidaError (dominio.prevision.excepciones) según el caso.
    """

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosResumenAnualExcelLeidos: ...
