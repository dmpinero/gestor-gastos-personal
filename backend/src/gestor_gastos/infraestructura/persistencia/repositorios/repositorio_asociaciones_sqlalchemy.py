from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from gestor_gastos.dominio.prevision.entidades import AsociacionConcepto
from gestor_gastos.infraestructura.persistencia.modelos import AsociacionConceptoModelo


def _a_entidad(modelo: AsociacionConceptoModelo) -> AsociacionConcepto:
    return AsociacionConcepto(
        id=modelo.id,
        categoria_resumen_id=modelo.categoria_resumen_id,
        subcategoria_resumen_id=modelo.subcategoria_resumen_id,
        categoria_movimiento_id=modelo.categoria_movimiento_id,
        subcategoria_movimiento_id=modelo.subcategoria_movimiento_id,
    )


class RepositorioAsociacionesSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def crear(self, asociacion: AsociacionConcepto) -> AsociacionConcepto:
        modelo = AsociacionConceptoModelo(
            categoria_resumen_id=asociacion.categoria_resumen_id,
            subcategoria_resumen_id=asociacion.subcategoria_resumen_id,
            categoria_movimiento_id=asociacion.categoria_movimiento_id,
            subcategoria_movimiento_id=asociacion.subcategoria_movimiento_id,
        )
        self._sesion.add(modelo)
        self._sesion.commit()
        return _a_entidad(modelo)

    def obtener_por_id(self, id_asociacion: int) -> AsociacionConcepto | None:
        modelo = self._sesion.get(AsociacionConceptoModelo, id_asociacion)
        return _a_entidad(modelo) if modelo else None

    def listar(self) -> list[AsociacionConcepto]:
        modelos = self._sesion.scalars(select(AsociacionConceptoModelo)).all()
        return [_a_entidad(m) for m in modelos]

    def obtener_por_categoria_resumen(
        self, categoria_resumen_id: int, subcategoria_resumen_id: int | None
    ) -> AsociacionConcepto | None:
        modelo = self._sesion.scalar(
            select(AsociacionConceptoModelo).where(
                AsociacionConceptoModelo.categoria_resumen_id == categoria_resumen_id,
                AsociacionConceptoModelo.subcategoria_resumen_id == subcategoria_resumen_id,
            )
        )
        return _a_entidad(modelo) if modelo else None

    def eliminar(self, id_asociacion: int) -> None:
        modelo = self._sesion.get(AsociacionConceptoModelo, id_asociacion)
        if modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()

    def _filtro_categoria(self, id_categoria: int):
        return or_(
            AsociacionConceptoModelo.categoria_resumen_id == id_categoria,
            AsociacionConceptoModelo.categoria_movimiento_id == id_categoria,
        )

    def _filtro_subcategoria(self, id_subcategoria: int):
        return or_(
            AsociacionConceptoModelo.subcategoria_resumen_id == id_subcategoria,
            AsociacionConceptoModelo.subcategoria_movimiento_id == id_subcategoria,
        )

    def contar_por_categoria(self, id_categoria: int) -> int:
        return self._sesion.scalar(
            select(func.count())
            .select_from(AsociacionConceptoModelo)
            .where(self._filtro_categoria(id_categoria))
        )

    def contar_por_subcategoria(self, id_subcategoria: int) -> int:
        return self._sesion.scalar(
            select(func.count())
            .select_from(AsociacionConceptoModelo)
            .where(self._filtro_subcategoria(id_subcategoria))
        )

    def eliminar_por_categoria(self, id_categoria: int) -> None:
        self._sesion.execute(
            AsociacionConceptoModelo.__table__.delete().where(self._filtro_categoria(id_categoria))
        )
        self._sesion.commit()

    def eliminar_por_subcategoria(self, id_subcategoria: int) -> None:
        self._sesion.execute(
            AsociacionConceptoModelo.__table__.delete().where(
                self._filtro_subcategoria(id_subcategoria)
            )
        )
        self._sesion.commit()
