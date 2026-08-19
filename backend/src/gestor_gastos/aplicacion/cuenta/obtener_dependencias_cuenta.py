from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas
from gestor_gastos.dominio.cuenta.valores import DependenciasCuenta
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class ObtenerDependenciasCuenta:
    def __init__(
        self, repositorio: RepositorioCuentas, repositorio_movimientos: RepositorioMovimientos
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos

    def ejecutar(self, id_cuenta: int) -> DependenciasCuenta:
        if self._repositorio.obtener_por_id(id_cuenta) is None:
            raise EntidadNoEncontradaError(f"No existe la cuenta con id {id_cuenta}")

        return DependenciasCuenta(
            movimientos=self._repositorio_movimientos.contar_movimientos_por_cuenta(id_cuenta)
        )
