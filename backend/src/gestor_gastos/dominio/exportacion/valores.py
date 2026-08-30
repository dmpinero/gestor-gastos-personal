from dataclasses import dataclass

from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.prevision.entidades import (
    AjusteMensual,
    AsociacionConcepto,
    AsociacionDescripcion,
    ConceptoPrevisto,
)


@dataclass
class DatosCompletos:
    """Volcado completo de todas las tablas de la aplicación, para exportación
    e importación (restauración de backup)."""

    cuentas: list[CuentaBancaria]
    categorias: list[Categoria]
    subcategorias: list[Subcategoria]
    movimientos: list[Movimiento]
    conceptos_previstos: list[ConceptoPrevisto]
    ajustes: list[AjusteMensual]
    asociaciones: list[AsociacionConcepto]
    asociaciones_descripcion: list[AsociacionDescripcion]


@dataclass
class ResumenImportacionDatosCompletos:
    """Cuántos registros de cada tabla trajo el Excel importado."""

    cuentas_importadas: int
    categorias_importadas: int
    subcategorias_importadas: int
    movimientos_importados: int
    conceptos_previstos_importados: int
    ajustes_importados: int
    asociaciones_importadas: int
    asociaciones_descripcion_importadas: int
