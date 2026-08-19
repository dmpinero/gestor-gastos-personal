import pytest
from sqlalchemy.orm import Session

from gestor_gastos.infraestructura.persistencia import modelos  # noqa: F401
from gestor_gastos.infraestructura.persistencia.sesion import FabricaSesiones


@pytest.fixture
def sesion_bd() -> Session:
    """Sesión de base de datos real, con las tablas relevantes vacías al empezar."""
    sesion = FabricaSesiones()
    sesion.execute(modelos.MovimientoModelo.__table__.delete())
    sesion.execute(modelos.ConceptoPrevistoModelo.__table__.delete())
    sesion.execute(modelos.SubcategoriaModelo.__table__.delete())
    sesion.execute(modelos.CategoriaModelo.__table__.delete())
    sesion.execute(modelos.CuentaBancariaModelo.__table__.delete())
    sesion.commit()
    try:
        yield sesion
    finally:
        sesion.close()
