from gestor_gastos.dominio.categoria.entidades import Subcategoria
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError


class ActualizarSubcategoria:
    def __init__(self, repositorio: RepositorioCategorias) -> None:
        self._repositorio = repositorio

    def ejecutar(self, id_subcategoria: int, nombre: str) -> Subcategoria:
        subcategoria = self._repositorio.obtener_subcategoria_por_id(id_subcategoria)
        if subcategoria is None:
            raise EntidadNoEncontradaError(f"No existe la subcategoría con id {id_subcategoria}")

        subcategoria.nombre = nombre
        return self._repositorio.actualizar_subcategoria(subcategoria)
