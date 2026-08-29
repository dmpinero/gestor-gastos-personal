import pytest

from gestor_gastos.aplicacion.exportacion.importar_datos_completos import ImportarDatosCompletos
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.exportacion.valores import DatosCompletos
from tests.unitarios.aplicacion.dobles import (
    LectorExportacionCompletaFalso,
    RepositorioImportacionCompletaFalso,
)


def _datos_de_ejemplo() -> DatosCompletos:
    return DatosCompletos(
        cuentas=[CuentaBancaria(id=1, numero_cuenta="ES00 1234")],
        categorias=[],
        subcategorias=[],
        movimientos=[],
        conceptos_previstos=[],
        ajustes=[],
        asociaciones=[],
    )


def test_importar_lee_el_fichero_y_reemplaza_todos_los_datos() -> None:
    datos = _datos_de_ejemplo()
    lector = LectorExportacionCompletaFalso(datos=datos)
    repositorio = RepositorioImportacionCompletaFalso()

    resumen = ImportarDatosCompletos(lector, repositorio).ejecutar(b"contenido", "backup.xlsx")

    assert repositorio.datos_recibidos is datos
    assert resumen.cuentas_importadas == 1
    assert resumen.categorias_importadas == 0
    assert resumen.movimientos_importados == 0


def test_si_el_fichero_no_es_valido_no_se_toca_el_repositorio() -> None:
    lector = LectorExportacionCompletaFalso(error=ValueError("fichero inválido"))
    repositorio = RepositorioImportacionCompletaFalso()

    with pytest.raises(ValueError):
        ImportarDatosCompletos(lector, repositorio).ejecutar(b"contenido", "backup.xlsx")

    assert repositorio.datos_recibidos is None


def test_si_el_repositorio_falla_la_excepcion_se_propaga() -> None:
    datos = _datos_de_ejemplo()
    lector = LectorExportacionCompletaFalso(datos=datos)
    repositorio = RepositorioImportacionCompletaFalso(error=RuntimeError("fallo de escritura"))

    with pytest.raises(RuntimeError):
        ImportarDatosCompletos(lector, repositorio).ejecutar(b"contenido", "backup.xlsx")
