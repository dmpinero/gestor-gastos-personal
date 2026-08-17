from dataclasses import dataclass


@dataclass
class Categoria:
    nombre: str
    id: int | None = None


@dataclass
class Subcategoria:
    nombre: str
    categoria_id: int
    id: int | None = None
