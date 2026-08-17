from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError


class ActualizarCuenta:
    """Edita los datos de una cuenta ya existente. El número de cuenta no es editable."""

    def __init__(self, repositorio: RepositorioCuentas) -> None:
        self._repositorio = repositorio

    def ejecutar(
        self,
        id_cuenta: int,
        alias: str | None = None,
        entidad_bancaria: str | None = None,
        moneda: str | None = None,
        titular: str | None = None,
    ) -> CuentaBancaria:
        cuenta = self._repositorio.obtener_por_id(id_cuenta)
        if cuenta is None:
            raise EntidadNoEncontradaError(f"No existe la cuenta con id {id_cuenta}")

        cuenta.alias = alias
        cuenta.entidad_bancaria = entidad_bancaria
        cuenta.moneda = moneda
        cuenta.titular = titular
        return self._repositorio.actualizar(cuenta)
