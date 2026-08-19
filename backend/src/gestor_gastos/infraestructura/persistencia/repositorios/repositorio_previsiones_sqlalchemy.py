from sqlalchemy import select
from sqlalchemy.orm import Session

from gestor_gastos.dominio.prevision.entidades import ConceptoPrevisto
from gestor_gastos.infraestructura.persistencia.modelos import ConceptoPrevistoModelo


def _a_entidad(modelo: ConceptoPrevistoModelo) -> ConceptoPrevisto:
    return ConceptoPrevisto(
        id=modelo.id,
        categoria_id=modelo.categoria_id,
        subcategoria_id=modelo.subcategoria_id,
        periodicidad=modelo.periodicidad,
        mes_inicio=modelo.mes_inicio,
        importe_previsto=modelo.importe_previsto,
    )


class RepositorioPrevisionesSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def crear(self, concepto: ConceptoPrevisto) -> ConceptoPrevisto:
        modelo = ConceptoPrevistoModelo(
            categoria_id=concepto.categoria_id,
            subcategoria_id=concepto.subcategoria_id,
            periodicidad=concepto.periodicidad,
            mes_inicio=concepto.mes_inicio,
            importe_previsto=concepto.importe_previsto,
        )
        self._sesion.add(modelo)
        self._sesion.commit()
        return _a_entidad(modelo)

    def obtener_por_id(self, id_concepto: int) -> ConceptoPrevisto | None:
        modelo = self._sesion.get(ConceptoPrevistoModelo, id_concepto)
        return _a_entidad(modelo) if modelo else None

    def listar(self) -> list[ConceptoPrevisto]:
        modelos = self._sesion.scalars(select(ConceptoPrevistoModelo)).all()
        return [_a_entidad(m) for m in modelos]

    def actualizar(self, concepto: ConceptoPrevisto) -> ConceptoPrevisto:
        modelo = self._sesion.get(ConceptoPrevistoModelo, concepto.id)
        modelo.categoria_id = concepto.categoria_id
        modelo.subcategoria_id = concepto.subcategoria_id
        modelo.periodicidad = concepto.periodicidad
        modelo.mes_inicio = concepto.mes_inicio
        modelo.importe_previsto = concepto.importe_previsto
        self._sesion.commit()
        return _a_entidad(modelo)

    def eliminar(self, id_concepto: int) -> None:
        modelo = self._sesion.get(ConceptoPrevistoModelo, id_concepto)
        if modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()
