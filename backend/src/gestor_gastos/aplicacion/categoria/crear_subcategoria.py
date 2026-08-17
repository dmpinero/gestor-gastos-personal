from gestor_gastos.dominio.categoria.entidades import Subcategoria
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError, NombreDuplicadoError


class CrearSubcategoria:
    def __init__(self, repositorio: RepositorioCategorias) -> None:
        self._repositorio = repositorio

    def ejecutar(self, id_categoria: int, nombre: str) -> Subcategoria:
        if self._repositorio.obtener_categoria_por_id(id_categoria) is None:
            raise EntidadNoEncontradaError(f"No existe la categoría con id {id_categoria}")

        if self._repositorio.obtener_subcategoria_por_nombre(id_categoria, nombre) is not None:
            raise NombreDuplicadoError(f"Ya existe la subcategoría '{nombre}' en esa categoría")

        return self._repositorio.crear_subcategoria(
            Subcategoria(nombre=nombre, categoria_id=id_categoria)
        )
