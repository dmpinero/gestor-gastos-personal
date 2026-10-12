from typing import Protocol


class AlmacenAdjuntos(Protocol):
    """Puerto de infraestructura para el contenido binario de un adjunto
    (no es persistencia SQL, ver dominio/importacion/lector_pdf.py y
    lector_excel.py para el mismo tipo de separación)."""

    def guardar(self, contenido: bytes, nombre_original: str) -> str:
        """Guarda el contenido y devuelve el nombre_almacenado (nunca el
        nombre_original: ver Adjunto.nombre_almacenado)."""
        ...

    def leer(self, nombre_almacenado: str) -> bytes: ...

    def eliminar(self, nombre_almacenado: str) -> None: ...
