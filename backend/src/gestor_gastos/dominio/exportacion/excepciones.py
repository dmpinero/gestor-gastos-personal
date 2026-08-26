class HojasExcelNoReconocidasError(Exception):
    """Se lanza cuando al Excel le falta alguna de las 6 hojas esperadas
    (formato generado por la propia exportación de datos completos)."""


class CabeceraExcelNoReconocidaError(Exception):
    """Se lanza cuando la fila de cabecera de una hoja no coincide con las
    columnas esperadas para esa hoja."""


class FilaExcelInvalidaError(Exception):
    """Se lanza cuando una fila de datos tiene un valor obligatorio vacío o
    de un tipo que no se puede convertir al esperado; el mensaje incluye la
    hoja y el número de fila para facilitar localizarla."""


class RestauracionDeDatosFallidaError(Exception):
    """Se lanza cuando la base de datos rechaza los datos del Excel al
    restaurarlos (p. ej. una referencia entre hojas que no existe, como un
    id de categoría en Movimientos que no está en la hoja Categorías)."""
