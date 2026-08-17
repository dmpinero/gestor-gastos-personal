from sqlalchemy import select
from sqlalchemy.orm import Session

from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.infraestructura.persistencia.modelos import CuentaBancariaModelo


def _a_entidad(modelo: CuentaBancariaModelo) -> CuentaBancaria:
    return CuentaBancaria(
        id=modelo.id,
        numero_cuenta=modelo.numero_cuenta,
        alias=modelo.alias,
        entidad_bancaria=modelo.entidad_bancaria,
        moneda=modelo.moneda,
        titular=modelo.titular,
    )


class RepositorioCuentasSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def crear(self, cuenta: CuentaBancaria) -> CuentaBancaria:
        modelo = CuentaBancariaModelo(
            numero_cuenta=cuenta.numero_cuenta,
            alias=cuenta.alias,
            entidad_bancaria=cuenta.entidad_bancaria,
            moneda=cuenta.moneda,
            titular=cuenta.titular,
        )
        self._sesion.add(modelo)
        self._sesion.commit()
        return _a_entidad(modelo)

    def obtener_por_id(self, id_cuenta: int) -> CuentaBancaria | None:
        modelo = self._sesion.get(CuentaBancariaModelo, id_cuenta)
        return _a_entidad(modelo) if modelo else None

    def obtener_por_numero_cuenta(self, numero_cuenta: str) -> CuentaBancaria | None:
        modelo = self._sesion.scalar(
            select(CuentaBancariaModelo).where(CuentaBancariaModelo.numero_cuenta == numero_cuenta)
        )
        return _a_entidad(modelo) if modelo else None

    def listar(self) -> list[CuentaBancaria]:
        modelos = self._sesion.scalars(select(CuentaBancariaModelo)).all()
        return [_a_entidad(m) for m in modelos]

    def actualizar(self, cuenta: CuentaBancaria) -> CuentaBancaria:
        modelo = self._sesion.get(CuentaBancariaModelo, cuenta.id)
        modelo.alias = cuenta.alias
        modelo.entidad_bancaria = cuenta.entidad_bancaria
        modelo.moneda = cuenta.moneda
        modelo.titular = cuenta.titular
        self._sesion.commit()
        return _a_entidad(modelo)

    def eliminar(self, id_cuenta: int) -> None:
        modelo = self._sesion.get(CuentaBancariaModelo, id_cuenta)
        if modelo is not None:
            self._sesion.delete(modelo)
            self._sesion.commit()
