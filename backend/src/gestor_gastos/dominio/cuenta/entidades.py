from dataclasses import dataclass


@dataclass
class CuentaBancaria:
    numero_cuenta: str
    id: int | None = None
    alias: str | None = None
    entidad_bancaria: str | None = None
    moneda: str | None = None
    titular: str | None = None
