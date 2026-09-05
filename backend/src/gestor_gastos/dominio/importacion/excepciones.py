class ExtensionNoSoportadaError(Exception):
    """Se lanza cuando el fichero subido no es .xls, .xlsx ni .pdf."""


class CabeceraNoReconocidaError(Exception):
    """Se lanza cuando no se localiza la fila de cabecera de columnas esperada."""


class FicheroSinMovimientosError(Exception):
    """Se lanza cuando el fichero tiene cabecera válida pero ninguna fila de datos."""
