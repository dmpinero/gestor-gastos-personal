from pathlib import Path
from uuid import uuid4


class AlmacenAdjuntosFilesystem:
    """Implementación de AlmacenAdjuntos que guarda el contenido en disco,
    en un directorio plano (sin subcarpetas: el volumen de datos de esta
    app es de uso personal, no necesita partición)."""

    def __init__(self, ruta_base: Path) -> None:
        self._ruta_base = ruta_base
        self._ruta_base.mkdir(parents=True, exist_ok=True)

    def guardar(self, contenido: bytes, nombre_original: str) -> str:
        # Path.suffix nunca incluye separadores de ruta (solo el texto tras
        # el último punto del componente final), así que es seguro usarlo
        # aunque nombre_original venga manipulado: no permite escapar de
        # ruta_base.
        nombre_almacenado = f"{uuid4().hex}{Path(nombre_original).suffix}"
        (self._ruta_base / nombre_almacenado).write_bytes(contenido)
        return nombre_almacenado

    def leer(self, nombre_almacenado: str) -> bytes:
        return (self._ruta_base / nombre_almacenado).read_bytes()

    def eliminar(self, nombre_almacenado: str) -> None:
        (self._ruta_base / nombre_almacenado).unlink(missing_ok=True)
