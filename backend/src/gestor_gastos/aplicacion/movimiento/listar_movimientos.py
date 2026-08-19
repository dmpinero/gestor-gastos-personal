from gestor_gastos.dominio.excepciones import FiltroDeListadoInvalidoError
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class ListarMovimientos:
    def __init__(self, repositorio: RepositorioMovimientos) -> None:
        self._repositorio = repositorio

    def ejecutar(
        self,
        cuenta_id: int | None = None,
        categoria_id: int | None = None,
        subcategoria_id: int | None = None,
        solo_gastos: bool = False,
    ) -> list[Movimiento]:
        filtros = [f for f in (cuenta_id, categoria_id, subcategoria_id) if f is not None]
        if len(filtros) != 1:
            raise FiltroDeListadoInvalidoError(
                "Debe indicarse exactamente uno de cuenta_id, categoria_id o subcategoria_id"
            )
        if cuenta_id is not None:
            return self._repositorio.listar_por_cuenta(cuenta_id)
        if categoria_id is not None:
            return self._repositorio.listar_por_categoria(categoria_id, solo_gastos=solo_gastos)
        return self._repositorio.listar_por_subcategoria(subcategoria_id, solo_gastos=solo_gastos)
