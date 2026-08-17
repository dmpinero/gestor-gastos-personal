from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas


class ListarCuentas:
    def __init__(self, repositorio: RepositorioCuentas) -> None:
        self._repositorio = repositorio

    def ejecutar(self) -> list[CuentaBancaria]:
        return self._repositorio.listar()
