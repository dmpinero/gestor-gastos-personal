from sqlalchemy import select
from sqlalchemy.orm import Session

from gestor_gastos.dominio.prevision.entidades import AjusteMensual
from gestor_gastos.infraestructura.persistencia.modelos import AjustePrevisionMensualModelo


def _a_entidad(modelo: AjustePrevisionMensualModelo) -> AjusteMensual:
    return AjusteMensual(
        id=modelo.id,
        concepto_id=modelo.concepto_id,
        anio=modelo.anio,
        mes=modelo.mes,
        importe=modelo.importe,
    )


class RepositorioAjustesPrevisionSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def guardar(self, ajuste: AjusteMensual) -> AjusteMensual:
        modelo = self._sesion.scalar(
            select(AjustePrevisionMensualModelo).where(
                AjustePrevisionMensualModelo.concepto_id == ajuste.concepto_id,
                AjustePrevisionMensualModelo.anio == ajuste.anio,
                AjustePrevisionMensualModelo.mes == ajuste.mes,
            )
        )
        if modelo is None:
            modelo = AjustePrevisionMensualModelo(
                concepto_id=ajuste.concepto_id,
                anio=ajuste.anio,
                mes=ajuste.mes,
                importe=ajuste.importe,
            )
            self._sesion.add(modelo)
        else:
            modelo.importe = ajuste.importe
        self._sesion.commit()
        return _a_entidad(modelo)

    def eliminar(self, id_concepto: int, anio: int, mes: int) -> None:
        modelo = self._sesion.scalar(
            select(AjustePrevisionMensualModelo).where(
                AjustePrevisionMensualModelo.concepto_id == id_concepto,
                AjustePrevisionMensualModelo.anio == anio,
                AjustePrevisionMensualModelo.mes == mes,
            )
        )
        if modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()

    def listar_por_anio(self, anio: int) -> list[AjusteMensual]:
        modelos = self._sesion.scalars(
            select(AjustePrevisionMensualModelo).where(AjustePrevisionMensualModelo.anio == anio)
        ).all()
        return [_a_entidad(m) for m in modelos]

    def listar_todos(self) -> list[AjusteMensual]:
        modelos = self._sesion.scalars(select(AjustePrevisionMensualModelo)).all()
        return [_a_entidad(m) for m in modelos]
