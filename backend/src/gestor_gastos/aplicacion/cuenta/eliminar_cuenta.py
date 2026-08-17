from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas
from gestor_gastos.dominio.excepciones import EntidadConDependenciasError, EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class EliminarCuenta:
    def __init__(
        self, repositorio: RepositorioCuentas, repositorio_movimientos: RepositorioMovimientos
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos

    def ejecutar(self, id_cuenta: int) -> None:
        if self._repositorio.obtener_por_id(id_cuenta) is None:
            raise EntidadNoEncontradaError(f"No existe la cuenta con id {id_cuenta}")

        if self._repositorio_movimientos.existen_movimientos_de_cuenta(id_cuenta):
            raise EntidadConDependenciasError(
                "No se puede eliminar la cuenta: tiene movimientos asociados"
            )

        self._repositorio.eliminar(id_cuenta)
