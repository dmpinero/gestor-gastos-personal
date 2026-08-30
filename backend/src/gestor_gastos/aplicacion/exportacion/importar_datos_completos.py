from gestor_gastos.dominio.exportacion.lector_exportacion_completa import (
    LectorExportacionCompleta,
)
from gestor_gastos.dominio.exportacion.repositorio_importacion_completa import (
    RepositorioImportacionCompleta,
)
from gestor_gastos.dominio.exportacion.valores import ResumenImportacionDatosCompletos


class ImportarDatosCompletos:
    def __init__(
        self,
        lector: LectorExportacionCompleta,
        repositorio: RepositorioImportacionCompleta,
    ) -> None:
        self._lector = lector
        self._repositorio = repositorio

    def ejecutar(self, contenido: bytes, nombre_fichero: str) -> ResumenImportacionDatosCompletos:
        datos = self._lector.leer(contenido, nombre_fichero)
        self._repositorio.reemplazar_todo(datos)
        return ResumenImportacionDatosCompletos(
            cuentas_importadas=len(datos.cuentas),
            categorias_importadas=len(datos.categorias),
            subcategorias_importadas=len(datos.subcategorias),
            movimientos_importados=len(datos.movimientos),
            conceptos_previstos_importados=len(datos.conceptos_previstos),
            ajustes_importados=len(datos.ajustes),
            asociaciones_importadas=len(datos.asociaciones),
            asociaciones_descripcion_importadas=len(datos.asociaciones_descripcion),
        )
