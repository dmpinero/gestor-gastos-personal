from pydantic import BaseModel, Field


class CuentaCrearEsquema(BaseModel):
    numero_cuenta: str = Field(min_length=1, max_length=64)
    alias: str | None = Field(default=None, max_length=120)
    entidad_bancaria: str | None = Field(default=None, max_length=120)
    moneda: str | None = Field(default=None, max_length=10)
    titular: str | None = Field(default=None, max_length=200)


class CuentaActualizarEsquema(BaseModel):
    alias: str | None = Field(default=None, max_length=120)
    entidad_bancaria: str | None = Field(default=None, max_length=120)
    moneda: str | None = Field(default=None, max_length=10)
    titular: str | None = Field(default=None, max_length=200)


class CuentaSalidaEsquema(BaseModel):
    id: int
    numero_cuenta: str
    alias: str | None
    entidad_bancaria: str | None
    moneda: str | None
    titular: str | None
