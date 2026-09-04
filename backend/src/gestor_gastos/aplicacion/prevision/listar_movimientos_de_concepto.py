from gestor_gastos.aplicacion.prevision.resolver_categoria_movimiento_real import (
    resolver_categoria_movimiento_real,
)
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAsociaciones,
    RepositorioAsociacionesDescripcion,
    RepositorioPrevisiones,
)


class ListarMovimientosDeConcepto:
    """Devuelve los movimientos concretos que componen el importe real de un
    concepto del resumen anual en un mes dado: los de su categoría/
    subcategoría real (por AsociacionConcepto) más los de cada
    AsociacionDescripcion, sin duplicar los que coincidan con ambas."""

    def __init__(
        self,
        repositorio: RepositorioPrevisiones,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_asociaciones: RepositorioAsociaciones,
        repositorio_asociaciones_descripcion: RepositorioAsociacionesDescripcion,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_movimientos = repositorio_movimientos
        self._repositorio_asociaciones = repositorio_asociaciones
        self._repositorio_asociaciones_descripcion = repositorio_asociaciones_descripcion

    def ejecutar(self, id_concepto: int, anio: int, mes: int) -> list[Movimiento]:
        concepto = self._repositorio.obtener_por_id(id_concepto)
        if concepto is None:
            raise EntidadNoEncontradaError(f"No existe el concepto previsto con id {id_concepto}")

        categoria_real, subcategoria_real = resolver_categoria_movimiento_real(
            concepto.categoria_id, concepto.subcategoria_id, self._repositorio_asociaciones
        )
        movimientos = self._repositorio_movimientos.listar_por_categoria_y_mes(
            categoria_real, subcategoria_real, anio, mes
        )
        vistos = {m.id for m in movimientos}

        asociaciones_descripcion_concepto = [
            a
            for a in self._repositorio_asociaciones_descripcion.listar()
            if a.categoria_resumen_id == concepto.categoria_id
            and a.subcategoria_resumen_id == concepto.subcategoria_id
        ]
        for a in asociaciones_descripcion_concepto:
            for m in self._repositorio_movimientos.listar_por_descripcion_y_mes(
                a.descripcion, anio, mes
            ):
                if m.id not in vistos:
                    movimientos.append(m)
                    vistos.add(m.id)

        movimientos.sort(key=lambda m: m.fecha_valor, reverse=True)
        return movimientos
