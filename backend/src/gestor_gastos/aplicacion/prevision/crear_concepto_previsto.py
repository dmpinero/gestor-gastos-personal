from decimal import Decimal

from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto, Periodicidad
from gestor_gastos.dominio.prevision.repositorio import RepositorioPrevisiones


class CrearConceptoPrevisto:
    def __init__(
        self,
        repositorio: RepositorioPrevisiones,
        repositorio_categorias: RepositorioCategorias,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_categorias = repositorio_categorias

    def ejecutar(
        self,
        categoria_id: int,
        subcategoria_id: int | None,
        periodicidad: Periodicidad,
        importe_previsto: Decimal,
        mes_inicio: int | None = None,
    ) -> ConceptoPrevisto:
        if self._repositorio_categorias.obtener_categoria_por_id(categoria_id) is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {categoria_id}")

        if subcategoria_id is not None:
            subcategoria = self._repositorio_categorias.obtener_subcategoria_por_id(subcategoria_id)
            if subcategoria is None or subcategoria.categoria_id != categoria_id:
                raise EntidadNoEncontradaError(
                    f"No existe la subcategoría con id {subcategoria_id} "
                    f"en la categoría {categoria_id}"
                )

        return self._repositorio.crear(
            ConceptoPrevisto(
                categoria_id=categoria_id,
                subcategoria_id=subcategoria_id,
                periodicidad=periodicidad,
                importe_previsto=importe_previsto,
                mes_inicio=mes_inicio,
            )
        )
