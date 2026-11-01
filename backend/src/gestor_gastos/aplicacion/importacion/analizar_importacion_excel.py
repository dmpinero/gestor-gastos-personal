from gestor_gastos.aplicacion.importacion.resolver_categoria_por_descripcion import (
    cargar_asociaciones_normalizadas,
    resolver_categoria_por_descripcion,
)
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.importacion.valores import (
    AnalisisImportacionExcel,
    DatosExcelLeidos,
    FilaPropuesta,
)
from gestor_gastos.dominio.prevision.repositorio import RepositorioAsociacionesDescripcion


class AnalizarImportacionExcel:
    """Solo lectura (no toca la base de datos, ver ImportarMovimientosExcel
    .leer): por cada fila, si su descripción coincide con una asociación por
    descripción ya configurada, propone esa categoría/subcategoría en vez de
    la que traiga el Excel; si no coincide ninguna, deja la del Excel tal
    cual (igual que el comportamiento actual sin este análisis)."""

    def __init__(
        self,
        repositorio_categorias: RepositorioCategorias,
        repositorio_asociaciones_descripcion: RepositorioAsociacionesDescripcion,
    ) -> None:
        self._categorias = repositorio_categorias
        self._asociaciones_descripcion = repositorio_asociaciones_descripcion

    def ejecutar(self, datos: DatosExcelLeidos) -> AnalisisImportacionExcel:
        asociaciones = cargar_asociaciones_normalizadas(self._asociaciones_descripcion)

        filas = []
        for fila in datos.filas:
            categoria_id, subcategoria_id = resolver_categoria_por_descripcion(
                fila.descripcion, asociaciones
            )
            propuesta_automatica = categoria_id is not None
            categoria, subcategoria = fila.categoria, fila.subcategoria
            if propuesta_automatica:
                categoria_resuelta = self._categorias.obtener_categoria_por_id(categoria_id)
                categoria = categoria_resuelta.nombre if categoria_resuelta else fila.categoria
                subcategoria_resuelta = (
                    self._categorias.obtener_subcategoria_por_id(subcategoria_id)
                    if subcategoria_id is not None
                    else None
                )
                subcategoria = subcategoria_resuelta.nombre if subcategoria_resuelta else None

            filas.append(
                FilaPropuesta(
                    fecha_valor=fila.fecha_valor,
                    descripcion=fila.descripcion,
                    comentario=fila.comentario,
                    importe=fila.importe,
                    saldo=fila.saldo,
                    categoria=categoria,
                    subcategoria=subcategoria,
                    categoria_original_excel=fila.categoria,
                    subcategoria_original_excel=fila.subcategoria,
                    propuesta_automatica=propuesta_automatica,
                )
            )

        return AnalisisImportacionExcel(cabecera=datos.cabecera, filas=filas)
