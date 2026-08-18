from pydantic import BaseModel


class ResumenImportacionEsquema(BaseModel):
    cuenta_id: int
    movimientos_importados: int
    movimientos_omitidos_por_duplicado: int
    categorias_creadas: list[str]
    subcategorias_creadas: list[str]
