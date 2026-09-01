from sqlalchemy import func, select
from sqlalchemy.orm import Session

from gestor_gastos.dominio.prevision.entidades import AsociacionDescripcion
from gestor_gastos.infraestructura.persistencia.modelos import AsociacionDescripcionModelo


def _a_entidad(modelo: AsociacionDescripcionModelo) -> AsociacionDescripcion:
    return AsociacionDescripcion(
        id=modelo.id,
        categoria_resumen_id=modelo.categoria_resumen_id,
        subcategoria_resumen_id=modelo.subcategoria_resumen_id,
        descripcion=modelo.descripcion,
    )


class RepositorioAsociacionesDescripcionSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def crear(self, asociacion: AsociacionDescripcion) -> AsociacionDescripcion:
        modelo = AsociacionDescripcionModelo(
            categoria_resumen_id=asociacion.categoria_resumen_id,
            subcategoria_resumen_id=asociacion.subcategoria_resumen_id,
            descripcion=asociacion.descripcion,
        )
        self._sesion.add(modelo)
        self._sesion.commit()
        return _a_entidad(modelo)

    def obtener_por_id(self, id_asociacion: int) -> AsociacionDescripcion | None:
        modelo = self._sesion.get(AsociacionDescripcionModelo, id_asociacion)
        return _a_entidad(modelo) if modelo else None

    def listar(self) -> list[AsociacionDescripcion]:
        modelos = self._sesion.scalars(select(AsociacionDescripcionModelo)).all()
        return [_a_entidad(m) for m in modelos]

    def obtener_por_descripcion(self, descripcion: str) -> AsociacionDescripcion | None:
        modelo = self._sesion.scalar(
            select(AsociacionDescripcionModelo).where(
                AsociacionDescripcionModelo.descripcion == descripcion
            )
        )
        return _a_entidad(modelo) if modelo else None

    def actualizar(self, asociacion: AsociacionDescripcion) -> AsociacionDescripcion:
        modelo = self._sesion.get(AsociacionDescripcionModelo, asociacion.id)
        modelo.categoria_resumen_id = asociacion.categoria_resumen_id
        modelo.subcategoria_resumen_id = asociacion.subcategoria_resumen_id
        modelo.descripcion = asociacion.descripcion
        self._sesion.commit()
        return _a_entidad(modelo)

    def eliminar(self, id_asociacion: int) -> None:
        modelo = self._sesion.get(AsociacionDescripcionModelo, id_asociacion)
        if modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()

    def _filtro_categoria(self, id_categoria: int):
        return AsociacionDescripcionModelo.categoria_resumen_id == id_categoria

    def _filtro_subcategoria(self, id_subcategoria: int):
        return AsociacionDescripcionModelo.subcategoria_resumen_id == id_subcategoria

    def contar_por_categoria(self, id_categoria: int) -> int:
        return self._sesion.scalar(
            select(func.count())
            .select_from(AsociacionDescripcionModelo)
            .where(self._filtro_categoria(id_categoria))
        )

    def contar_por_subcategoria(self, id_subcategoria: int) -> int:
        return self._sesion.scalar(
            select(func.count())
            .select_from(AsociacionDescripcionModelo)
            .where(self._filtro_subcategoria(id_subcategoria))
        )

    def eliminar_por_categoria(self, id_categoria: int) -> None:
        self._sesion.execute(
            AsociacionDescripcionModelo.__table__.delete().where(
                self._filtro_categoria(id_categoria)
            )
        )
        self._sesion.commit()

    def eliminar_por_subcategoria(self, id_subcategoria: int) -> None:
        self._sesion.execute(
            AsociacionDescripcionModelo.__table__.delete().where(
                self._filtro_subcategoria(id_subcategoria)
            )
        )
        self._sesion.commit()
