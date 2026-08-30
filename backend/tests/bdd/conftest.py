import pytest
from fastapi.testclient import TestClient

from gestor_gastos.infraestructura.persistencia import modelos  # noqa: F401
from gestor_gastos.infraestructura.persistencia.sesion import FabricaSesiones
from gestor_gastos.main import crear_aplicacion


@pytest.fixture
def cliente() -> TestClient:
    """Cliente HTTP contra la aplicación real, con las tablas relevantes vacías."""
    sesion = FabricaSesiones()
    sesion.execute(modelos.AsociacionConceptoModelo.__table__.delete())
    sesion.execute(modelos.AsociacionDescripcionModelo.__table__.delete())
    sesion.execute(modelos.MovimientoModelo.__table__.delete())
    sesion.execute(modelos.AjustePrevisionMensualModelo.__table__.delete())
    sesion.execute(modelos.ConceptoPrevistoModelo.__table__.delete())
    sesion.execute(modelos.SubcategoriaModelo.__table__.delete())
    sesion.execute(modelos.CategoriaModelo.__table__.delete())
    sesion.execute(modelos.CuentaBancariaModelo.__table__.delete())
    sesion.commit()
    sesion.close()

    return TestClient(crear_aplicacion())
