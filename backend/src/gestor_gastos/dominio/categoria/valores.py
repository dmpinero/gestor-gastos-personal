from dataclasses import dataclass


@dataclass(frozen=True)
class DependenciasCategoria:
    subcategorias: int
    movimientos: int
    conceptos_previstos: int
    asociaciones: int


@dataclass(frozen=True)
class DependenciasSubcategoria:
    movimientos: int
    conceptos_previstos: int
    asociaciones: int
