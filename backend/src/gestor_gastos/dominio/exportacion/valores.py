from dataclasses import dataclass

from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.prevision.entidades import AjusteMensual, ConceptoPrevisto


@dataclass
class DatosCompletos:
    """Volcado completo de todas las tablas de la aplicación, para exportación."""

    cuentas: list[CuentaBancaria]
    categorias: list[Categoria]
    subcategorias: list[Subcategoria]
    movimientos: list[Movimiento]
    conceptos_previstos: list[ConceptoPrevisto]
    ajustes: list[AjusteMensual]
