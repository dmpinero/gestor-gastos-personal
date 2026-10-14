from sqlalchemy import select
from sqlalchemy.orm import Session

from gestor_gastos.dominio.prevision.entidades import ConceptoCanceladoAnio
from gestor_gastos.infraestructura.persistencia.modelos import ConceptoCanceladoAnioModelo


def _a_entidad(modelo: ConceptoCanceladoAnioModelo) -> ConceptoCanceladoAnio:
    return ConceptoCanceladoAnio(id=modelo.id, concepto_id=modelo.concepto_id, anio=modelo.anio)


class RepositorioConceptosCanceladosSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def establecer(self, concepto_id: int, anio: int, cancelado: bool) -> None:
        modelo = self._sesion.scalar(
            select(ConceptoCanceladoAnioModelo).where(
                ConceptoCanceladoAnioModelo.concepto_id == concepto_id,
                ConceptoCanceladoAnioModelo.anio == anio,
            )
        )
        if cancelado and modelo is None:
            self._sesion.add(ConceptoCanceladoAnioModelo(concepto_id=concepto_id, anio=anio))
            self._sesion.commit()
        elif not cancelado and modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()

    def listar_por_anio(self, anio: int) -> list[ConceptoCanceladoAnio]:
        modelos = self._sesion.scalars(
            select(ConceptoCanceladoAnioModelo).where(ConceptoCanceladoAnioModelo.anio == anio)
        ).all()
        return [_a_entidad(m) for m in modelos]
