from typing import Protocol

from gestor_gastos.dominio.importacion.valores import DatosPdfLeidos


class LectorPdf(Protocol):
    """Puerto que lee un certificado de movimientos en PDF y extrae su contenido.

    Debe lanzar ExtensionNoSoportadaError, CabeceraNoReconocidaError o
    FicheroSinMovimientosError (dominio.importacion.excepciones) según el caso.
    """

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosPdfLeidos: ...
