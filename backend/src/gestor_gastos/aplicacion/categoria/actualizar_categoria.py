from gestor_gastos.dominio.categoria.entidades import Categoria
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError, NombreDuplicadoError


class ActualizarCategoria:
    def __init__(self, repositorio: RepositorioCategorias) -> None:
        self._repositorio = repositorio

    def ejecutar(self, id_categoria: int, nombre: str) -> Categoria:
        categoria = self._repositorio.obtener_categoria_por_id(id_categoria)
        if categoria is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {id_categoria}")

        existente = self._repositorio.obtener_categoria_por_nombre(nombre)
        if existente is not None and existente.id != id_categoria:
            raise NombreDuplicadoError(f"Ya existe la categoría '{nombre}'")

        categoria.nombre = nombre
        return self._repositorio.actualizar_categoria(categoria)
