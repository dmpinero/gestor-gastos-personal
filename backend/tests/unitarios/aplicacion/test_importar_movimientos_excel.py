import datetime
from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.importacion.importar_movimientos_excel import (
    ImportarMovimientosExcel,
)
from gestor_gastos.dominio.importacion.excepciones import CabeceraNoReconocidaError
from gestor_gastos.dominio.importacion.valores import (
    CabeceraExcel,
    DatosExcelLeidos,
    FilaMovimientoExcel,
)
from tests.unitarios.aplicacion.dobles import (
    LectorExcelFalso,
    RepositorioCategoriasFalso,
    RepositorioCuentasFalso,
    RepositorioMovimientosFalso,
)


def _fila(
    fecha,
    categoria="Alimentación",
    subcategoria="Supermercados",
    importe="-10.00",
    saldo="100.00",
    descripcion="Compra",
):
    return FilaMovimientoExcel(
        fecha_valor=fecha,
        categoria=categoria,
        subcategoria=subcategoria,
        descripcion=descripcion,
        comentario=None,
        importe=Decimal(importe),
        saldo=Decimal(saldo),
    )


def _construir_caso_de_uso(lector):
    repo_cuentas = RepositorioCuentasFalso()
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    caso_de_uso = ImportarMovimientosExcel(repo_cuentas, repo_categorias, repo_movimientos, lector)
    return caso_de_uso, repo_cuentas, repo_categorias, repo_movimientos


def test_importa_crea_cuenta_nueva_y_movimientos() -> None:
    datos = DatosExcelLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular="Ana"),
        filas=[_fila(datetime.date(2026, 1, 1))],
    )
    caso_de_uso, repo_cuentas, _, repo_movimientos = _construir_caso_de_uso(
        LectorExcelFalso(datos=datos)
    )

    resumen = caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")

    cuenta = repo_cuentas.obtener_por_numero_cuenta("ES00 1234")
    assert cuenta is not None
    assert cuenta.titular == "Ana"
    # El alias es el mismo dato que el titular (celda D2 del Excel), y la
    # moneda no viene en el fichero: siempre se asume euros.
    assert cuenta.alias == "Ana"
    assert cuenta.moneda == "€"
    assert resumen.movimientos_importados == 1
    assert len(repo_movimientos.listar_por_cuenta(cuenta.id)) == 1


def test_importa_sin_titular_deja_el_alias_vacio_pero_la_moneda_en_euros() -> None:
    datos = DatosExcelLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None),
        filas=[_fila(datetime.date(2026, 1, 1))],
    )
    caso_de_uso, repo_cuentas, _, _ = _construir_caso_de_uso(LectorExcelFalso(datos=datos))

    caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")

    cuenta = repo_cuentas.obtener_por_numero_cuenta("ES00 1234")
    assert cuenta is not None
    assert cuenta.alias is None
    assert cuenta.moneda == "€"


def test_el_resumen_incluye_el_id_de_la_cuenta_usada() -> None:
    datos = DatosExcelLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular="Ana"),
        filas=[_fila(datetime.date(2026, 1, 1))],
    )
    caso_de_uso, repo_cuentas, _, _ = _construir_caso_de_uso(LectorExcelFalso(datos=datos))

    resumen = caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")

    cuenta = repo_cuentas.obtener_por_numero_cuenta("ES00 1234")
    assert cuenta is not None
    assert resumen.cuenta_id == cuenta.id


def test_importa_reutiliza_cuenta_existente() -> None:
    datos = DatosExcelLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular="Ana"),
        filas=[_fila(datetime.date(2026, 1, 1))],
    )
    caso_de_uso, repo_cuentas, _, _ = _construir_caso_de_uso(LectorExcelFalso(datos=datos))
    caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")

    caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")

    assert len(repo_cuentas.listar()) == 1


def test_importa_crea_categorias_y_subcategorias_nuevas_una_sola_vez() -> None:
    datos = DatosExcelLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None),
        filas=[
            _fila(datetime.date(2026, 1, 1), descripcion="Compra 1"),
            _fila(datetime.date(2026, 1, 2), descripcion="Compra 2"),
        ],
    )
    caso_de_uso, _, repo_categorias, _ = _construir_caso_de_uso(LectorExcelFalso(datos=datos))

    resumen = caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")

    assert resumen.categorias_creadas == ["Alimentación"]
    assert resumen.subcategorias_creadas == ["Supermercados"]
    assert len(repo_categorias.listar_categorias()) == 1


def test_importa_omite_movimiento_duplicado() -> None:
    fila_1 = _fila(datetime.date(2026, 1, 1))
    datos = DatosExcelLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None), filas=[fila_1]
    )
    caso_de_uso, _, _, _ = _construir_caso_de_uso(LectorExcelFalso(datos=datos))
    caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")

    resumen = caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")

    assert resumen.movimientos_importados == 0
    assert resumen.movimientos_omitidos_por_duplicado == 1


def test_resumen_mixto_con_movimientos_nuevos_y_duplicados_en_la_misma_importacion() -> None:
    fila_repetida = _fila(datetime.date(2026, 1, 1), descripcion="Repetida")
    datos_primera_importacion = DatosExcelLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None), filas=[fila_repetida]
    )
    caso_de_uso, repo_cuentas, repo_categorias, repo_movimientos = _construir_caso_de_uso(
        LectorExcelFalso(datos=datos_primera_importacion)
    )
    caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")

    datos_segunda_importacion = DatosExcelLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None),
        filas=[
            fila_repetida,
            _fila(datetime.date(2026, 1, 2), descripcion="Nueva"),
        ],
    )
    caso_de_uso_mixto = ImportarMovimientosExcel(
        repo_cuentas,
        repo_categorias,
        repo_movimientos,
        LectorExcelFalso(datos=datos_segunda_importacion),
    )

    resumen = caso_de_uso_mixto.ejecutar(b"contenido", "movimientos.xlsx")

    assert resumen.movimientos_importados == 1
    assert resumen.movimientos_omitidos_por_duplicado == 1


def test_error_del_lector_se_propaga() -> None:
    caso_de_uso, _, _, _ = _construir_caso_de_uso(
        LectorExcelFalso(error=CabeceraNoReconocidaError("formato no reconocido"))
    )

    with pytest.raises(CabeceraNoReconocidaError):
        caso_de_uso.ejecutar(b"contenido", "movimientos.xlsx")
