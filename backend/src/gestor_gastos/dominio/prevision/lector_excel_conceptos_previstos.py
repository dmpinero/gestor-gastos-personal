from typing import Protocol

from gestor_gastos.dominio.prevision.valores import DatosConceptosPrevistosExcelLeidos


class LectorExcelConceptosPrevistos(Protocol):
    """Puerto que lee un Excel de alta masiva de conceptos previstos.

    Debe lanzar ExtensionNoSoportadaError (dominio.importacion.excepciones),
    FicheroSinConceptosPrevistosError, PeriodicidadNoReconocidaError o
    ImportePrevistoInvalidoError (dominio.prevision.excepciones) según el caso.
    """

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosConceptosPrevistosExcelLeidos: ...
