from typing import Protocol

from gestor_gastos.dominio.adjunto.entidades import Adjunto


class RepositorioAdjuntos(Protocol):
    """Puerto de persistencia para Adjunto (solo metadata; el contenido del
    fichero lo gestiona AlmacenAdjuntos, ver almacen.py)."""

    def crear(self, adjunto: Adjunto) -> Adjunto: ...

    def obtener_por_id(self, id_adjunto: int) -> Adjunto | None: ...

    def listar_por_movimiento(self, movimiento_id: int) -> list[Adjunto]: ...

    def contar_por_movimiento_de_todos(self) -> dict[int, int]:
        """Número de adjuntos de cada movimiento que tiene al menos uno, de
        una sola vez (sin filtrar por id): alimenta el indicador que se
        muestra en las tablas de movimientos, evitando una petición por
        fila."""
        ...

    def eliminar(self, id_adjunto: int) -> None: ...
