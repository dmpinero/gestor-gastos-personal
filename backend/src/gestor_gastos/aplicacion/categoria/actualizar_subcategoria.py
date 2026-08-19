from gestor_gastos.dominio.categoria.entidades import Subcategoria
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError, NombreDuplicadoError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class ActualizarSubcategoria:
    def __init__(
        self, repositorio: RepositorioCategorias, repositorio_movimientos: RepositorioMovimientos
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos

    def ejecutar(self, id_subcategoria: int, nombre: str, categoria_id: int) -> Subcategoria:
        subcategoria = self._repositorio.obtener_subcategoria_por_id(id_subcategoria)
        if subcategoria is None:
            raise EntidadNoEncontradaError(f"No existe la subcategoría con id {id_subcategoria}")

        if self._repositorio.obtener_categoria_por_id(categoria_id) is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {categoria_id}")

        existente = self._repositorio.obtener_subcategoria_por_nombre(categoria_id, nombre)
        if existente is not None and existente.id != id_subcategoria:
            raise NombreDuplicadoError(f"Ya existe la subcategoría '{nombre}' en esa categoría")

        categoria_anterior = subcategoria.categoria_id
        subcategoria.nombre = nombre
        subcategoria.categoria_id = categoria_id
        actualizada = self._repositorio.actualizar_subcategoria(subcategoria)

        if categoria_anterior != categoria_id:
            self._repositorio_movimientos.actualizar_categoria_de_movimientos_por_subcategoria(
                id_subcategoria, categoria_id
            )

        return actualizada
