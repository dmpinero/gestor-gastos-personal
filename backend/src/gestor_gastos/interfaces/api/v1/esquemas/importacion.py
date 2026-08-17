from pydantic import BaseModel


class ResumenImportacionEsquema(BaseModel):
    movimientos_importados: int
    movimientos_omitidos_por_duplicado: int
    categorias_creadas: list[str]
    subcategorias_creadas: list[str]
