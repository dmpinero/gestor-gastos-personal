from decimal import Decimal

from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.entidades import AjusteMensual
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAjustesMensuales,
    RepositorioPrevisiones,
)


class AjustarValorMensual:
    def __init__(
        self,
        repositorio: RepositorioPrevisiones,
        repositorio_ajustes: RepositorioAjustesMensuales,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_ajustes = repositorio_ajustes

    def ejecutar(self, id_concepto: int, anio: int, mes: int, importe: Decimal) -> AjusteMensual:
        if self._repositorio.obtener_por_id(id_concepto) is None:
            raise EntidadNoEncontradaError(f"No existe el concepto previsto con id {id_concepto}")

        return self._repositorio_ajustes.guardar(
            AjusteMensual(concepto_id=id_concepto, anio=anio, mes=mes, importe=importe)
        )
