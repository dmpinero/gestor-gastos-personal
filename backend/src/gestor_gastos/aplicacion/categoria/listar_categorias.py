from dataclasses import dataclass

from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias


@dataclass
class CategoriaConSubcategorias:
    categoria: Categoria
    subcategorias: list[Subcategoria]


class ListarCategorias:
    def __init__(self, repositorio: RepositorioCategorias) -> None:
        self._repositorio = repositorio

    def ejecutar(self) -> list[CategoriaConSubcategorias]:
        return [
            CategoriaConSubcategorias(
                categoria=categoria,
                subcategorias=self._repositorio.listar_subcategorias_de(categoria.id),
            )
            for categoria in self._repositorio.listar_categorias()
        ]
