from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto
from gestor_gastos.dominio.prevision.lector_excel_conceptos_previstos import (
    LectorExcelConceptosPrevistos,
)
from gestor_gastos.dominio.prevision.repositorio import RepositorioPrevisiones
from gestor_gastos.dominio.prevision.valores import (
    FilaConceptoPrevistoExcel,
    ResumenImportacionConceptosPrevistos,
)


class ImportarConceptosPrevistosExcel:
    """Orquesta la lectura de un Excel de alta masiva de conceptos previstos.

    Crea la categoría/subcategoría si no existen (igual que
    ImportarMovimientosExcel). Un concepto previsto se identifica por su
    combinación (categoria_id, subcategoria_id): si ya existe uno con esa
    combinación se omite sin duplicar ni actualizar; si no existe se crea
    con mes_inicio=None (el dominio lo trata como mes 1).
    """

    def __init__(
        self,
        repositorio_categorias: RepositorioCategorias,
        repositorio_previsiones: RepositorioPrevisiones,
        lector: LectorExcelConceptosPrevistos,
    ) -> None:
        self._categorias = repositorio_categorias
        self._previsiones = repositorio_previsiones
        self._lector = lector

    def ejecutar(
        self, contenido: bytes, nombre_fichero: str
    ) -> ResumenImportacionConceptosPrevistos:
        datos = self._lector.leer(contenido, nombre_fichero)

        resumen = ResumenImportacionConceptosPrevistos()
        cache_categorias: dict[str, Categoria] = {}
        cache_subcategorias: dict[tuple[int, str], Subcategoria] = {}
        combinaciones_existentes = {
            (c.categoria_id, c.subcategoria_id) for c in self._previsiones.listar()
        }

        for fila in datos.filas:
            categoria = self._obtener_o_crear_categoria(fila.categoria, cache_categorias, resumen)
            subcategoria_id = None
            if fila.subcategoria:
                subcategoria = self._obtener_o_crear_subcategoria(
                    categoria.id, fila.subcategoria, cache_subcategorias, resumen
                )
                subcategoria_id = subcategoria.id

            clave = (categoria.id, subcategoria_id)
            if clave in combinaciones_existentes:
                resumen.conceptos_omitidos_por_duplicado += 1
                continue

            self._crear_concepto(categoria.id, subcategoria_id, fila)
            combinaciones_existentes.add(clave)
            resumen.conceptos_creados += 1

        return resumen

    def _obtener_o_crear_categoria(
        self,
        nombre: str,
        cache: dict[str, Categoria],
        resumen: ResumenImportacionConceptosPrevistos,
    ) -> Categoria:
        if nombre in cache:
            return cache[nombre]

        categoria = self._categorias.obtener_categoria_por_nombre(nombre)
        if categoria is None:
            categoria = self._categorias.crear_categoria(Categoria(nombre=nombre))
            resumen.categorias_creadas.append(nombre)

        cache[nombre] = categoria
        return categoria

    def _obtener_o_crear_subcategoria(
        self,
        id_categoria: int,
        nombre: str,
        cache: dict[tuple[int, str], Subcategoria],
        resumen: ResumenImportacionConceptosPrevistos,
    ) -> Subcategoria:
        clave = (id_categoria, nombre)
        if clave in cache:
            return cache[clave]

        subcategoria = self._categorias.obtener_subcategoria_por_nombre(id_categoria, nombre)
        if subcategoria is None:
            subcategoria = self._categorias.crear_subcategoria(
                Subcategoria(nombre=nombre, categoria_id=id_categoria)
            )
            resumen.subcategorias_creadas.append(nombre)

        cache[clave] = subcategoria
        return subcategoria

    def _crear_concepto(
        self, id_categoria: int, id_subcategoria: int | None, fila: FilaConceptoPrevistoExcel
    ) -> None:
        self._previsiones.crear(
            ConceptoPrevisto(
                categoria_id=id_categoria,
                subcategoria_id=id_subcategoria,
                periodicidad=fila.periodicidad,
                importe_previsto=fila.importe_previsto,
                mes_inicio=None,
            )
        )
