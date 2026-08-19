from pydantic import BaseModel, Field


class CategoriaCrearEsquema(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)


class CategoriaActualizarEsquema(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)


class CategoriaSalidaEsquema(BaseModel):
    id: int
    nombre: str


class SubcategoriaCrearEsquema(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)


class SubcategoriaActualizarEsquema(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    categoria_id: int


class SubcategoriaSalidaEsquema(BaseModel):
    id: int
    nombre: str
    categoria_id: int


class CategoriaConSubcategoriasSalidaEsquema(BaseModel):
    categoria: CategoriaSalidaEsquema
    subcategorias: list[SubcategoriaSalidaEsquema]


class DependenciasCategoriaEsquema(BaseModel):
    subcategorias: int
    movimientos: int


class DependenciasSubcategoriaEsquema(BaseModel):
    movimientos: int
