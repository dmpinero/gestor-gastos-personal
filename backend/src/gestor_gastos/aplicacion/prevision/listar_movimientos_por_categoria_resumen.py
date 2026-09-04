from gestor_gastos.aplicacion.prevision.resolver_categoria_movimiento_real import (
    resolver_categoria_movimiento_real,
)
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAsociaciones,
    RepositorioAsociacionesDescripcion,
)


class ListarMovimientosPorCategoriaResumen:
    """Devuelve todos los movimientos (de cualquier fecha) de una categoría o
    subcategoría del árbol de categorías, tal y como se navega desde
    Historial: los de su categoría/subcategoría real (por AsociacionConcepto)
    más los de cada AsociacionDescripcion configurada para esa categoría/
    subcategoría, sin duplicar los que coincidan con ambas.

    Sin esto, Historial solo encontraba los movimientos guardados
    literalmente con esa categoría/subcategoría, y no los que un concepto del
    resumen anual localiza a través de una asociación (p.ej. "Amazon Prime"
    agrupa movimientos guardados bajo otra categoría real)."""

    def __init__(
        self,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_asociaciones: RepositorioAsociaciones,
        repositorio_asociaciones_descripcion: RepositorioAsociacionesDescripcion,
    ) -> None:
        self._repositorio_movimientos = repositorio_movimientos
        self._repositorio_asociaciones = repositorio_asociaciones
        self._repositorio_asociaciones_descripcion = repositorio_asociaciones_descripcion

    def ejecutar(self, categoria_id: int, subcategoria_id: int | None) -> list[Movimiento]:
        categoria_real, subcategoria_real = resolver_categoria_movimiento_real(
            categoria_id, subcategoria_id, self._repositorio_asociaciones
        )
        if subcategoria_real is not None:
            movimientos = self._repositorio_movimientos.listar_por_subcategoria(subcategoria_real)
        else:
            movimientos = self._repositorio_movimientos.listar_por_categoria(categoria_real)
        vistos = {m.id for m in movimientos}

        asociaciones_descripcion = [
            a
            for a in self._repositorio_asociaciones_descripcion.listar()
            if a.categoria_resumen_id == categoria_id
            and a.subcategoria_resumen_id == subcategoria_id
        ]
        for a in asociaciones_descripcion:
            for m in self._repositorio_movimientos.listar_por_descripcion(a.descripcion):
                if m.id not in vistos:
                    movimientos.append(m)
                    vistos.add(m.id)

        movimientos.sort(key=lambda m: m.fecha_valor, reverse=True)
        return movimientos
