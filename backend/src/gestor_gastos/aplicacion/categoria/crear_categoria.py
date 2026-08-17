from gestor_gastos.dominio.categoria.entidades import Categoria
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.excepciones import NombreDuplicadoError


class CrearCategoria:
    def __init__(self, repositorio: RepositorioCategorias) -> None:
        self._repositorio = repositorio

    def ejecutar(self, nombre: str) -> Categoria:
        if self._repositorio.obtener_categoria_por_nombre(nombre) is not None:
            raise NombreDuplicadoError(f"Ya existe la categoría '{nombre}'")

        return self._repositorio.crear_categoria(Categoria(nombre=nombre))
