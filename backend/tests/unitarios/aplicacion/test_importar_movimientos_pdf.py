import datetime
from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.importacion.importar_movimientos_pdf import (
    NOMBRE_CATEGORIA_SIN_CATEGORIZAR,
    ImportarMovimientosPdf,
)
from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.importacion.excepciones import CabeceraNoReconocidaError
from gestor_gastos.dominio.importacion.valores import (
    CabeceraExcel,
    DatosPdfLeidos,
    EventoProgreso,
    FilaMovimientoPdf,
    ResumenImportacion,
)
from gestor_gastos.dominio.prevision.entidades import AsociacionDescripcion
from tests.unitarios.aplicacion.dobles import (
    LectorPdfFalso,
    RepositorioAsociacionesDescripcionFalso,
    RepositorioCategoriasFalso,
    RepositorioCuentasFalso,
    RepositorioMovimientosFalso,
)


def _fila(fecha, descripcion="Pago tienda", importe="-10.00", saldo="100.00"):
    return FilaMovimientoPdf(
        fecha_valor=fecha, descripcion=descripcion, importe=Decimal(importe), saldo=Decimal(saldo)
    )


def _construir_caso_de_uso(lector):
    repo_cuentas = RepositorioCuentasFalso()
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    caso_de_uso = ImportarMovimientosPdf(
        repo_cuentas, repo_categorias, repo_movimientos, repo_asociaciones_descripcion, lector
    )
    return (
        caso_de_uso,
        repo_cuentas,
        repo_categorias,
        repo_movimientos,
        repo_asociaciones_descripcion,
    )


def _importar(
    caso_de_uso, contenido: bytes = b"contenido", nombre_fichero: str = "movimientos.pdf"
) -> ResumenImportacion:
    datos = caso_de_uso.leer(contenido, nombre_fichero)
    *_, resumen = caso_de_uso.ejecutar(datos)
    return resumen


def test_importa_crea_cuenta_nueva_y_movimientos() -> None:
    datos = DatosPdfLeidos(
        cabecera=CabeceraExcel(numero_cuenta="1465 0100 96 1705727894", titular="Noelia"),
        filas=[_fila(datetime.date(2026, 1, 1))],
    )
    caso_de_uso, repo_cuentas, _, repo_movimientos, _ = _construir_caso_de_uso(
        LectorPdfFalso(datos=datos)
    )

    resumen = _importar(caso_de_uso)

    cuenta = repo_cuentas.obtener_por_numero_cuenta("1465 0100 96 1705727894")
    assert cuenta is not None
    assert cuenta.titular == "Noelia"
    assert cuenta.alias == "Noelia"
    assert cuenta.moneda == "€"
    assert resumen.movimientos_importados == 1
    assert len(repo_movimientos.listar_por_cuenta(cuenta.id)) == 1


def test_reconoce_una_cuenta_ya_existente_aunque_el_espaciado_del_numero_difiera() -> None:
    # El Excel y el PDF del banco pueden agrupar los espacios del número de
    # cuenta de forma distinta para el mismo CCC: "1465 0100 9617 05727894"
    # (Excel) frente a "1465 0100 96 1705727894" (PDF) son la misma cuenta.
    datos = DatosPdfLeidos(
        cabecera=CabeceraExcel(numero_cuenta="1465 0100 96 1705727894", titular="Noelia"),
        filas=[_fila(datetime.date(2026, 1, 1))],
    )
    caso_de_uso, repo_cuentas, _, _, _ = _construir_caso_de_uso(LectorPdfFalso(datos=datos))
    cuenta_existente = repo_cuentas.crear(
        CuentaBancaria(numero_cuenta="1465 0100 9617 05727894", titular="Noelia")
    )

    resumen = _importar(caso_de_uso)

    assert resumen.cuenta_id == cuenta_existente.id
    assert len(repo_cuentas.listar()) == 1


def test_sin_asociacion_que_coincida_deja_el_movimiento_en_sin_categorizar() -> None:
    datos = DatosPdfLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None),
        filas=[_fila(datetime.date(2026, 1, 1), descripcion="Pago en Comercio Desconocido")],
    )
    caso_de_uso, repo_cuentas, repo_categorias, repo_movimientos, _ = _construir_caso_de_uso(
        LectorPdfFalso(datos=datos)
    )

    resumen = _importar(caso_de_uso)

    assert resumen.categorias_creadas == [NOMBRE_CATEGORIA_SIN_CATEGORIZAR]
    cuenta = repo_cuentas.obtener_por_numero_cuenta("ES00 1234")
    assert cuenta is not None
    movimiento = repo_movimientos.listar_por_cuenta(cuenta.id)[0]
    categoria = repo_categorias.obtener_categoria_por_id(movimiento.categoria_id)
    assert categoria is not None
    assert categoria.nombre == NOMBRE_CATEGORIA_SIN_CATEGORIZAR
    assert movimiento.subcategoria_id is None


def test_la_categoria_sin_categorizar_se_crea_una_sola_vez_para_varias_filas() -> None:
    datos = DatosPdfLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None),
        filas=[
            _fila(datetime.date(2026, 1, 1), descripcion="Pago 1"),
            _fila(datetime.date(2026, 1, 2), descripcion="Pago 2"),
        ],
    )
    caso_de_uso, _, repo_categorias, _, _ = _construir_caso_de_uso(LectorPdfFalso(datos=datos))

    resumen = _importar(caso_de_uso)

    assert resumen.categorias_creadas == [NOMBRE_CATEGORIA_SIN_CATEGORIZAR]
    assert len(repo_categorias.listar_categorias()) == 1


def test_autocategoriza_por_asociacion_de_descripcion_existente() -> None:
    datos = DatosPdfLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None),
        filas=[_fila(datetime.date(2026, 1, 1), descripcion="Pago en Amazon Prime*ABC123")],
    )
    caso_de_uso, repo_cuentas, repo_categorias, repo_movimientos, repo_asociaciones = (
        _construir_caso_de_uso(LectorPdfFalso(datos=datos))
    )
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    subcategoria = repo_categorias.crear_subcategoria(
        Subcategoria(nombre="Amazon Prime", categoria_id=categoria.id)
    )
    repo_asociaciones.crear(
        AsociacionDescripcion(
            categoria_resumen_id=categoria.id,
            subcategoria_resumen_id=subcategoria.id,
            descripcion="Amazon Prime",
        )
    )

    resumen = _importar(caso_de_uso)

    assert resumen.categorias_creadas == []
    cuenta = repo_cuentas.obtener_por_numero_cuenta("ES00 1234")
    assert cuenta is not None
    movimiento = repo_movimientos.listar_por_cuenta(cuenta.id)[0]
    assert movimiento.categoria_id == categoria.id
    assert movimiento.subcategoria_id == subcategoria.id


def test_con_varias_asociaciones_coincidentes_usa_la_mas_especifica() -> None:
    datos = DatosPdfLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None),
        filas=[_fila(datetime.date(2026, 1, 1), descripcion="Pago en PAYPAL *DAZN DE 12345 DE")],
    )
    caso_de_uso, repo_cuentas, repo_categorias, repo_movimientos, repo_asociaciones = (
        _construir_caso_de_uso(LectorPdfFalso(datos=datos))
    )
    categoria_generica = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones varias"))
    categoria_especifica = repo_categorias.crear_categoria(Categoria(nombre="Dazn.com"))
    repo_asociaciones.crear(
        AsociacionDescripcion(
            categoria_resumen_id=categoria_generica.id,
            subcategoria_resumen_id=None,
            descripcion="PAYPAL",
        )
    )
    repo_asociaciones.crear(
        AsociacionDescripcion(
            categoria_resumen_id=categoria_especifica.id,
            subcategoria_resumen_id=None,
            descripcion="PAYPAL *DAZN",
        )
    )

    _importar(caso_de_uso)

    cuenta = repo_cuentas.obtener_por_numero_cuenta("ES00 1234")
    assert cuenta is not None
    movimiento = repo_movimientos.listar_por_cuenta(cuenta.id)[0]
    assert movimiento.categoria_id == categoria_especifica.id


def test_importa_omite_movimiento_duplicado_y_reporta_la_categoria_resuelta() -> None:
    fila_1 = _fila(datetime.date(2026, 1, 1), descripcion="Pago en Comercio Desconocido")
    datos = DatosPdfLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None), filas=[fila_1]
    )
    caso_de_uso, _, _, repo_movimientos, _ = _construir_caso_de_uso(LectorPdfFalso(datos=datos))
    _importar(caso_de_uso)

    resumen = _importar(caso_de_uso)

    assert resumen.movimientos_importados == 0
    assert resumen.movimientos_omitidos_por_duplicado == 1
    duplicado = resumen.duplicados[0]
    assert duplicado.fila_excel.fecha_valor == fila_1.fecha_valor
    assert duplicado.fila_excel.descripcion == fila_1.descripcion
    assert duplicado.fila_excel.importe == fila_1.importe
    assert duplicado.fila_excel.saldo == fila_1.saldo
    # La categoría "Sin categorizar" ya resuelta se refleja en el reporte,
    # igual que si viniera de un Excel con esa columna.
    assert duplicado.fila_excel.categoria == NOMBRE_CATEGORIA_SIN_CATEGORIZAR
    movimiento_existente_esperado = repo_movimientos.listar_por_cuenta(resumen.cuenta_id)[0]
    assert duplicado.movimiento_existente.id == movimiento_existente_esperado.id


def test_ejecutar_emite_un_evento_de_progreso_por_fila_y_termina_con_el_resumen() -> None:
    datos = DatosPdfLeidos(
        cabecera=CabeceraExcel(numero_cuenta="ES00 1234", titular=None),
        filas=[
            _fila(datetime.date(2026, 1, 1), descripcion="Pago 1"),
            _fila(datetime.date(2026, 1, 2), descripcion="Pago 2"),
        ],
    )
    caso_de_uso, _, _, _, _ = _construir_caso_de_uso(LectorPdfFalso(datos=datos))
    datos_leidos = caso_de_uso.leer(b"contenido", "movimientos.pdf")

    eventos = list(caso_de_uso.ejecutar(datos_leidos))

    assert eventos[:-1] == [
        EventoProgreso(procesadas=1, total=2),
        EventoProgreso(procesadas=2, total=2),
    ]
    assert isinstance(eventos[-1], ResumenImportacion)
    assert eventos[-1].movimientos_importados == 2


def test_leer_propaga_el_error_del_lector_sin_empezar_a_procesar() -> None:
    caso_de_uso, _, _, _, _ = _construir_caso_de_uso(
        LectorPdfFalso(error=CabeceraNoReconocidaError("no se ha encontrado el número de cuenta"))
    )

    with pytest.raises(CabeceraNoReconocidaError):
        caso_de_uso.leer(b"contenido", "movimientos.pdf")
