from typing import Protocol

from gestor_gastos.dominio.importacion.valores import DatosExcelLeidos


class LectorExcel(Protocol):
    """Puerto que lee un fichero Excel de movimientos y extrae su contenido.

    Debe lanzar ExtensionNoSoportadaError, CabeceraNoReconocidaError o
    FicheroSinMovimientosError (dominio.importacion.excepciones) según el caso.
    """

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosExcelLeidos: ...
