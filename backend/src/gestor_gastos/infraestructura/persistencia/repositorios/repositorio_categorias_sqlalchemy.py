from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.infraestructura.persistencia.modelos import CategoriaModelo, SubcategoriaModelo


def _categoria_a_entidad(modelo: CategoriaModelo) -> Categoria:
    return Categoria(id=modelo.id, nombre=modelo.nombre)


def _subcategoria_a_entidad(modelo: SubcategoriaModelo) -> Subcategoria:
    return Subcategoria(id=modelo.id, nombre=modelo.nombre, categoria_id=modelo.categoria_id)


class RepositorioCategoriasSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def crear_categoria(self, categoria: Categoria) -> Categoria:
        modelo = CategoriaModelo(nombre=categoria.nombre)
        self._sesion.add(modelo)
        self._sesion.commit()
        return _categoria_a_entidad(modelo)

    def obtener_categoria_por_id(self, id_categoria: int) -> Categoria | None:
        modelo = self._sesion.get(CategoriaModelo, id_categoria)
        return _categoria_a_entidad(modelo) if modelo else None

    def obtener_categoria_por_nombre(self, nombre: str) -> Categoria | None:
        modelo = self._sesion.scalar(
            select(CategoriaModelo).where(CategoriaModelo.nombre == nombre)
        )
        return _categoria_a_entidad(modelo) if modelo else None

    def listar_categorias(self) -> list[Categoria]:
        modelos = self._sesion.scalars(select(CategoriaModelo)).all()
        return [_categoria_a_entidad(m) for m in modelos]

    def actualizar_categoria(self, categoria: Categoria) -> Categoria:
        modelo = self._sesion.get(CategoriaModelo, categoria.id)
        modelo.nombre = categoria.nombre
        self._sesion.commit()
        return _categoria_a_entidad(modelo)

    def eliminar_categoria(self, id_categoria: int) -> None:
        modelo = self._sesion.get(CategoriaModelo, id_categoria)
        if modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()

    def contar_subcategorias(self, id_categoria: int) -> int:
        return self._sesion.scalar(
            select(func.count())
            .select_from(SubcategoriaModelo)
            .where(SubcategoriaModelo.categoria_id == id_categoria)
        )

    def eliminar_subcategorias_de(self, id_categoria: int) -> None:
        self._sesion.execute(
            delete(SubcategoriaModelo).where(SubcategoriaModelo.categoria_id == id_categoria)
        )
        self._sesion.commit()

    def crear_subcategoria(self, subcategoria: Subcategoria) -> Subcategoria:
        modelo = SubcategoriaModelo(
            nombre=subcategoria.nombre, categoria_id=subcategoria.categoria_id
        )
        self._sesion.add(modelo)
        self._sesion.commit()
        return _subcategoria_a_entidad(modelo)

    def obtener_subcategoria_por_id(self, id_subcategoria: int) -> Subcategoria | None:
        modelo = self._sesion.get(SubcategoriaModelo, id_subcategoria)
        return _subcategoria_a_entidad(modelo) if modelo else None

    def obtener_subcategoria_por_nombre(
        self, id_categoria: int, nombre: str
    ) -> Subcategoria | None:
        modelo = self._sesion.scalar(
            select(SubcategoriaModelo).where(
                SubcategoriaModelo.categoria_id == id_categoria,
                SubcategoriaModelo.nombre == nombre,
            )
        )
        return _subcategoria_a_entidad(modelo) if modelo else None

    def listar_subcategorias_de(self, id_categoria: int) -> list[Subcategoria]:
        modelos = self._sesion.scalars(
            select(SubcategoriaModelo).where(SubcategoriaModelo.categoria_id == id_categoria)
        ).all()
        return [_subcategoria_a_entidad(m) for m in modelos]

    def actualizar_subcategoria(self, subcategoria: Subcategoria) -> Subcategoria:
        modelo = self._sesion.get(SubcategoriaModelo, subcategoria.id)
        modelo.nombre = subcategoria.nombre
        modelo.categoria_id = subcategoria.categoria_id
        self._sesion.commit()
        return _subcategoria_a_entidad(modelo)

    def eliminar_subcategoria(self, id_subcategoria: int) -> None:
        modelo = self._sesion.get(SubcategoriaModelo, id_subcategoria)
        if modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()
