from decimal import Decimal

from pydantic import BaseModel


class SaldoCuentaEsquema(BaseModel):
    cuenta_id: int
    numero_cuenta: str
    alias: str | None
    saldo: Decimal


class TotalCategoriaEsquema(BaseModel):
    categoria_id: int
    nombre: str
    total: Decimal


class ResumenDashboardEsquema(BaseModel):
    saldo_global: Decimal
    saldos_por_cuenta: list[SaldoCuentaEsquema]
    gastos_por_categoria: list[TotalCategoriaEsquema]
    ingresos_por_categoria: list[TotalCategoriaEsquema]
