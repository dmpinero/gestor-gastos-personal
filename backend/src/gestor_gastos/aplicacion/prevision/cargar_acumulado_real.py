from decimal import Decimal

from gestor_gastos.aplicacion.prevision.resolver_categoria_movimiento_real import (
    resolver_categoria_movimiento_real,
)
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.entidades import AjusteMensual
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAjustesMensuales,
    RepositorioAsociaciones,
    RepositorioAsociacionesDescripcion,
    RepositorioPrevisiones,
)


class CargarAcumuladoReal:
    """Sobrescribe, para cada mes del año con movimientos reales asociados a
    un concepto (por categoría o por descripción), su ajuste mensual con el
    importe real acumulado — incluso si ya había un ajuste manual. Los meses
    sin movimientos asociados no se modifican."""

    def __init__(
        self,
        repositorio: RepositorioPrevisiones,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_ajustes: RepositorioAjustesMensuales,
        repositorio_asociaciones: RepositorioAsociaciones,
        repositorio_asociaciones_descripcion: RepositorioAsociacionesDescripcion,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos
        self._repositorio_ajustes = repositorio_ajustes
        self._repositorio_asociaciones = repositorio_asociaciones
        self._repositorio_asociaciones_descripcion = repositorio_asociaciones_descripcion

    def ejecutar(self, id_concepto: int, anio: int) -> int:
        concepto = self._repositorio.obtener_por_id(id_concepto)
        if concepto is None:
            raise EntidadNoEncontradaError(f"No existe el concepto previsto con id {id_concepto}")

        categoria_real, subcategoria_real = resolver_categoria_movimiento_real(
            concepto, self._repositorio_asociaciones
        )
        sumas_reales = self._repositorio_movimientos.sumar_movimientos_por_mes(anio)
        asociaciones_descripcion_concepto = [
            a
            for a in self._repositorio_asociaciones_descripcion.listar()
            if a.categoria_resumen_id == concepto.categoria_id
            and a.subcategoria_resumen_id == concepto.subcategoria_id
        ]
        sumas_por_descripcion = {
            a.descripcion: self._repositorio_movimientos.sumar_movimientos_por_descripcion_y_mes(
                anio, a.descripcion
            )
            for a in asociaciones_descripcion_concepto
        }

        meses_actualizados = 0
        for mes in range(1, 13):
            real_categoria = sumas_reales.get((categoria_real, subcategoria_real, mes))
            real_total = real_categoria if real_categoria is not None else Decimal("0")
            hay_real = real_categoria is not None
            for a in asociaciones_descripcion_concepto:
                real_descripcion = sumas_por_descripcion[a.descripcion].get(mes)
                if real_descripcion is not None:
                    real_total += real_descripcion
                    hay_real = True

            if hay_real:
                self._repositorio_ajustes.guardar(
                    AjusteMensual(concepto_id=id_concepto, anio=anio, mes=mes, importe=real_total)
                )
                meses_actualizados += 1

        return meses_actualizados
