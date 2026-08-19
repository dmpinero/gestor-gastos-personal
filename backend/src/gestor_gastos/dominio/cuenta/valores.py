from dataclasses import dataclass


@dataclass(frozen=True)
class DependenciasCuenta:
    movimientos: int
