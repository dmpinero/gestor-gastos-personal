from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas
from gestor_gastos.dominio.excepciones import NombreDuplicadoError


class CrearCuenta:
    def __init__(self, repositorio: RepositorioCuentas) -> None:
        self._repositorio = repositorio

    def ejecutar(
        self,
        numero_cuenta: str,
        alias: str | None = None,
        entidad_bancaria: str | None = None,
        moneda: str | None = None,
        titular: str | None = None,
    ) -> CuentaBancaria:
        if self._repositorio.obtener_por_numero_cuenta(numero_cuenta) is not None:
            raise NombreDuplicadoError(f"Ya existe una cuenta con número '{numero_cuenta}'")

        cuenta = CuentaBancaria(
            numero_cuenta=numero_cuenta,
            alias=alias,
            entidad_bancaria=entidad_bancaria,
            moneda=moneda,
            titular=titular,
        )
        return self._repositorio.crear(cuenta)
