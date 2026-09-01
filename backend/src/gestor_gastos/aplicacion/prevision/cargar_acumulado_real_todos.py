from decimal import Decimal

from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.entidades import AjusteMensual, AsociacionDescripcion
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAjustesMensuales,
    RepositorioAsociaciones,
    RepositorioAsociacionesDescripcion,
    RepositorioPrevisiones,
)


class CargarAcumuladoRealTodos:
    """Igual que CargarAcumuladoReal, pero para todos los conceptos previstos
    a la vez: precarga una sola vez las sumas reales y las asociaciones (en
    vez de una consulta por concepto) y sobrescribe el ajuste mensual de cada
    concepto con movimientos reales asociados en el año."""

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

    def ejecutar(self, anio: int) -> tuple[int, int]:
        conceptos = self._repositorio.listar()
        sumas_reales = self._repositorio_movimientos.sumar_movimientos_por_mes(anio)

        asociaciones = {
            (a.categoria_resumen_id, a.subcategoria_resumen_id): (
                a.categoria_movimiento_id,
                a.subcategoria_movimiento_id,
            )
            for a in self._repositorio_asociaciones.listar()
        }

        asociaciones_descripcion_por_concepto: dict[
            tuple[int, int | None], list[AsociacionDescripcion]
        ] = {}
        for a in self._repositorio_asociaciones_descripcion.listar():
            clave = (a.categoria_resumen_id, a.subcategoria_resumen_id)
            asociaciones_descripcion_por_concepto.setdefault(clave, []).append(a)

        conceptos_actualizados = 0
        meses_actualizados_total = 0

        for concepto in conceptos:
            categoria_real, subcategoria_real = asociaciones.get(
                (concepto.categoria_id, concepto.subcategoria_id),
                (concepto.categoria_id, concepto.subcategoria_id),
            )
            asociaciones_descripcion_concepto = asociaciones_descripcion_por_concepto.get(
                (concepto.categoria_id, concepto.subcategoria_id), []
            )
            sumas_por_descripcion = {
                a.descripcion: (
                    self._repositorio_movimientos.sumar_movimientos_por_descripcion_y_mes(
                        anio, a.descripcion, categoria_real, subcategoria_real
                    )
                )
                for a in asociaciones_descripcion_concepto
            }

            meses_actualizados_concepto = 0
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
                        AjusteMensual(
                            concepto_id=concepto.id, anio=anio, mes=mes, importe=real_total
                        )
                    )
                    meses_actualizados_concepto += 1

            if meses_actualizados_concepto > 0:
                conceptos_actualizados += 1
            meses_actualizados_total += meses_actualizados_concepto

        return conceptos_actualizados, meses_actualizados_total
