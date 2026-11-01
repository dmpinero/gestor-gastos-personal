import datetime

from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.notificaciones.deteccion import detectar_proximos_eventos
from gestor_gastos.dominio.notificaciones.entidades import ProximoEvento
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAsociaciones,
    RepositorioAsociacionesDescripcion,
    RepositorioPrevisiones,
)


class ListarProximosEventos:
    """Solo detecta recurrencia entre los movimientos que pertenecen a algún
    concepto previsto del Resumen Anual (por categoría/subcategoría, directa
    o vía AsociacionConcepto, o por descripción vía AsociacionDescripcion):
    el resto de categorías que el usuario no sigue en el resumen no generan
    notificaciones, para no mezclar gastos puntuales con los recurrentes que
    sí vigila."""

    def __init__(
        self,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_previsiones: RepositorioPrevisiones,
        repositorio_asociaciones: RepositorioAsociaciones,
        repositorio_asociaciones_descripcion: RepositorioAsociacionesDescripcion,
    ) -> None:
        self._repositorio_movimientos = repositorio_movimientos
        self._repositorio_previsiones = repositorio_previsiones
        self._repositorio_asociaciones = repositorio_asociaciones
        self._repositorio_asociaciones_descripcion = repositorio_asociaciones_descripcion

    def ejecutar(self, hoy: datetime.date | None = None) -> list[ProximoEvento]:
        hoy = hoy or datetime.date.today()
        claves_concepto = {
            (concepto.categoria_id, concepto.subcategoria_id)
            for concepto in self._repositorio_previsiones.listar()
        }
        if not claves_concepto:
            return []

        categorias_permitidas = set(claves_concepto)
        for asociacion in self._repositorio_asociaciones.listar():
            clave_resumen = (asociacion.categoria_resumen_id, asociacion.subcategoria_resumen_id)
            if clave_resumen in claves_concepto:
                categorias_permitidas.add(
                    (asociacion.categoria_movimiento_id, asociacion.subcategoria_movimiento_id)
                )

        fragmentos_descripcion = [
            asociacion.descripcion.lower()
            for asociacion in self._repositorio_asociaciones_descripcion.listar()
            if (asociacion.categoria_resumen_id, asociacion.subcategoria_resumen_id)
            in claves_concepto
        ]

        movimientos = [
            movimiento
            for movimiento in self._repositorio_movimientos.listar_todos()
            if self._pertenece_al_resumen_anual(
                movimiento, categorias_permitidas, fragmentos_descripcion
            )
        ]
        return detectar_proximos_eventos(movimientos, hoy)

    @staticmethod
    def _pertenece_al_resumen_anual(
        movimiento: Movimiento,
        categorias_permitidas: set[tuple[int, int | None]],
        fragmentos_descripcion: list[str],
    ) -> bool:
        if (movimiento.categoria_id, movimiento.subcategoria_id) in categorias_permitidas:
            return True
        # Un concepto declarado a nivel de categoría (sin subcategoría)
        # cubre cualquier subcategoría real dentro de esa categoría.
        if (movimiento.categoria_id, None) in categorias_permitidas:
            return True
        descripcion = movimiento.descripcion.lower()
        return any(fragmento in descripcion for fragmento in fragmentos_descripcion)
