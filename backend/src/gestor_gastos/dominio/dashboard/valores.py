from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class SaldoCuenta:
    cuenta_id: int
    numero_cuenta: str
    alias: str | None
    saldo: Decimal


@dataclass(frozen=True)
class TotalCategoria:
    categoria_id: int
    nombre: str
    total: Decimal


@dataclass(frozen=True)
class ResumenDashboard:
    saldo_global: Decimal
    saldos_por_cuenta: list[SaldoCuenta]
    gastos_por_categoria: list[TotalCategoria]
    ingresos_por_categoria: list[TotalCategoria]
