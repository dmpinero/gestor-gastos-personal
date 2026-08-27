from pydantic import BaseModel


class ResumenImportacionDatosCompletosEsquema(BaseModel):
    cuentas_importadas: int
    categorias_importadas: int
    subcategorias_importadas: int
    movimientos_importados: int
    conceptos_previstos_importados: int
    ajustes_importados: int
