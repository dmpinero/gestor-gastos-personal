from dataclasses import dataclass


@dataclass(frozen=True)
class DependenciasCategoria:
    subcategorias: int
    movimientos: int


@dataclass(frozen=True)
class DependenciasSubcategoria:
    movimientos: int
