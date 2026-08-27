import datetime
from decimal import Decimal

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.movimiento.crear_movimiento import CrearMovimiento
from gestor_gastos.aplicacion.prevision.ajustar_valor_mensual import AjustarValorMensual
from gestor_gastos.aplicacion.prevision.crear_concepto_previsto import CrearConceptoPrevisto
from gestor_gastos.aplicacion.prevision.eliminar_ajuste_mensual import EliminarAjusteMensual
from gestor_gastos.aplicacion.prevision.importar_resumen_anual_excel import (
    ImportarResumenAnualExcel,
)
from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.prevision.valores import (
    CeldaResumenAnualExcel,
    DatosResumenAnualExcelLeidos,
)
from tests.unitarios.aplicacion.dobles import (
    LectorExcelResumenAnualFalso,
    RepositorioAjustesPrevisionFalso,
    RepositorioCategoriasFalso,
    RepositorioCuentasFalso,
    RepositorioMovimientosFalso,
    RepositorioPrevisionesFalso,
)

ANIO = 2026


def _preparar():
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_ajustes = RepositorioAjustesPrevisionFalso()
    repo_cuentas = RepositorioCuentasFalso()
    obtener_resumen = ObtenerResumenAnual(
        repo_previsiones, repo_categorias, repo_movimientos, repo_ajustes
    )
    ajustar = AjustarValorMensual(repo_previsiones, repo_ajustes)
    eliminar_ajuste = EliminarAjusteMensual(repo_previsiones, repo_ajustes)
    categoria = CrearCategoria(repo_categorias).ejecutar("Suscripciones")
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    return (
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        repo_cuentas,
        obtener_resumen,
        ajustar,
        eliminar_ajuste,
        concepto,
    )


def _celdas_sin_cambios(
    obtener_resumen: ObtenerResumenAnual, concepto_id: int, anio: int = ANIO
) -> dict[int, Decimal]:
    resumen = obtener_resumen.ejecutar(anio)
    fila = next(f for f in resumen.filas_gastos if f.concepto_id == concepto_id)
    return {v.mes: v.importe for v in fila.valores}


def _importar(lector, obtener_resumen, ajustar, eliminar_ajuste):
    return ImportarResumenAnualExcel(lector, obtener_resumen, ajustar, eliminar_ajuste).ejecutar(
        b"contenido", "resumen-anual-2026.xlsx"
    )


def test_reimportar_sin_cambios_no_hace_nada() -> None:
    *_, repo_ajustes, _, obtener_resumen, ajustar, eliminar_ajuste, concepto = _preparar()
    valores = _celdas_sin_cambios(obtener_resumen, concepto.id)
    celdas = [
        CeldaResumenAnualExcel(concepto_id=concepto.id, anio=ANIO, mes=mes, importe=importe)
        for mes, importe in valores.items()
    ]
    lector = LectorExcelResumenAnualFalso(datos=DatosResumenAnualExcelLeidos(celdas=celdas))

    resultado = _importar(lector, obtener_resumen, ajustar, eliminar_ajuste)

    assert resultado.celdas_actualizadas == 0
    assert resultado.celdas_eliminadas == 0
    assert resultado.conceptos_no_encontrados == 0
    assert repo_ajustes.listar_por_anio(ANIO) == []


def test_cambiar_un_mes_real_en_excel_crea_un_ajuste() -> None:
    (
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        repo_cuentas,
        obtener_resumen,
        ajustar,
        eliminar_ajuste,
        concepto,
    ) = _preparar()
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=concepto.categoria_id,
        fecha_valor=datetime.date(ANIO, 3, 15),
        descripcion="Amazon Prime",
        importe=Decimal("-4.99"),
        saldo=Decimal("100.00"),
    )
    valores = _celdas_sin_cambios(obtener_resumen, concepto.id)
    valores[3] = Decimal("-1.00")  # el Excel cambia el mes de marzo (real)
    celdas = [
        CeldaResumenAnualExcel(concepto_id=concepto.id, anio=ANIO, mes=mes, importe=importe)
        for mes, importe in valores.items()
    ]
    lector = LectorExcelResumenAnualFalso(datos=DatosResumenAnualExcelLeidos(celdas=celdas))

    resultado = _importar(lector, obtener_resumen, ajustar, eliminar_ajuste)

    assert resultado.celdas_actualizadas == 1
    ajustes = repo_ajustes.listar_por_anio(ANIO)
    assert len(ajustes) == 1
    assert ajustes[0].mes == 3
    assert ajustes[0].importe == Decimal("-1.00")


def test_cambiar_un_mes_previsto_en_excel_crea_un_ajuste() -> None:
    *_, obtener_resumen, ajustar, eliminar_ajuste, concepto = _preparar()
    valores = _celdas_sin_cambios(obtener_resumen, concepto.id)
    valores[5] = Decimal("-20.00")
    celdas = [
        CeldaResumenAnualExcel(concepto_id=concepto.id, anio=ANIO, mes=mes, importe=importe)
        for mes, importe in valores.items()
    ]
    lector = LectorExcelResumenAnualFalso(datos=DatosResumenAnualExcelLeidos(celdas=celdas))

    resultado = _importar(lector, obtener_resumen, ajustar, eliminar_ajuste)

    assert resultado.celdas_actualizadas == 1


def test_cambiar_un_ajuste_existente_por_otro_valor() -> None:
    *_, repo_ajustes, _, obtener_resumen, ajustar, eliminar_ajuste, concepto = _preparar()
    ajustar.ejecutar(concepto.id, ANIO, 6, Decimal("-1.00"))
    valores = _celdas_sin_cambios(obtener_resumen, concepto.id)
    valores[6] = Decimal("-2.00")
    celdas = [
        CeldaResumenAnualExcel(concepto_id=concepto.id, anio=ANIO, mes=mes, importe=importe)
        for mes, importe in valores.items()
    ]
    lector = LectorExcelResumenAnualFalso(datos=DatosResumenAnualExcelLeidos(celdas=celdas))

    resultado = _importar(lector, obtener_resumen, ajustar, eliminar_ajuste)

    assert resultado.celdas_actualizadas == 1
    ajustes = repo_ajustes.listar_por_anio(ANIO)
    assert len(ajustes) == 1
    assert ajustes[0].importe == Decimal("-2.00")


def test_celda_vacia_sobre_un_ajuste_existente_lo_elimina() -> None:
    *_, repo_ajustes, _, obtener_resumen, ajustar, eliminar_ajuste, concepto = _preparar()
    ajustar.ejecutar(concepto.id, ANIO, 7, Decimal("-3.00"))
    valores = _celdas_sin_cambios(obtener_resumen, concepto.id)
    valores[7] = None
    celdas = [
        CeldaResumenAnualExcel(concepto_id=concepto.id, anio=ANIO, mes=mes, importe=importe)
        for mes, importe in valores.items()
    ]
    lector = LectorExcelResumenAnualFalso(datos=DatosResumenAnualExcelLeidos(celdas=celdas))

    resultado = _importar(lector, obtener_resumen, ajustar, eliminar_ajuste)

    assert resultado.celdas_eliminadas == 1
    assert repo_ajustes.listar_por_anio(ANIO) == []


def test_celda_vacia_sin_ajuste_previo_no_hace_nada() -> None:
    *_, repo_ajustes, _, obtener_resumen, ajustar, eliminar_ajuste, concepto = _preparar()
    valores = _celdas_sin_cambios(obtener_resumen, concepto.id)
    valores[8] = None  # mes previsto, sin ajuste
    celdas = [
        CeldaResumenAnualExcel(concepto_id=concepto.id, anio=ANIO, mes=mes, importe=importe)
        for mes, importe in valores.items()
    ]
    lector = LectorExcelResumenAnualFalso(datos=DatosResumenAnualExcelLeidos(celdas=celdas))

    resultado = _importar(lector, obtener_resumen, ajustar, eliminar_ajuste)

    assert resultado.celdas_actualizadas == 0
    assert resultado.celdas_eliminadas == 0
    assert repo_ajustes.listar_por_anio(ANIO) == []


def test_concepto_inexistente_se_cuenta_y_no_crea_nada() -> None:
    *_, obtener_resumen, ajustar, eliminar_ajuste, _ = _preparar()
    celdas = [
        CeldaResumenAnualExcel(concepto_id=999, anio=ANIO, mes=mes, importe=Decimal("-1.00"))
        for mes in range(1, 13)
    ]
    lector = LectorExcelResumenAnualFalso(datos=DatosResumenAnualExcelLeidos(celdas=celdas))

    resultado = _importar(lector, obtener_resumen, ajustar, eliminar_ajuste)

    assert resultado.conceptos_no_encontrados == 1
    assert resultado.celdas_actualizadas == 0
    assert resultado.celdas_eliminadas == 0


def test_celdas_de_anios_distintos_se_aplican_cada_una_a_su_propio_anio() -> None:
    *_, repo_ajustes, _, obtener_resumen, ajustar, eliminar_ajuste, concepto = _preparar()
    otro_anio = ANIO + 1
    valores_anio_actual = _celdas_sin_cambios(obtener_resumen, concepto.id, ANIO)
    valores_anio_actual[2] = Decimal("-5.00")
    valores_otro_anio = _celdas_sin_cambios(obtener_resumen, concepto.id, otro_anio)
    valores_otro_anio[9] = Decimal("-7.00")
    celdas = [
        CeldaResumenAnualExcel(concepto_id=concepto.id, anio=ANIO, mes=mes, importe=importe)
        for mes, importe in valores_anio_actual.items()
    ] + [
        CeldaResumenAnualExcel(concepto_id=concepto.id, anio=otro_anio, mes=mes, importe=importe)
        for mes, importe in valores_otro_anio.items()
    ]
    lector = LectorExcelResumenAnualFalso(datos=DatosResumenAnualExcelLeidos(celdas=celdas))

    resultado = _importar(lector, obtener_resumen, ajustar, eliminar_ajuste)

    assert resultado.celdas_actualizadas == 2
    ajuste_anio_actual = repo_ajustes.listar_por_anio(ANIO)
    ajuste_otro_anio = repo_ajustes.listar_por_anio(otro_anio)
    assert len(ajuste_anio_actual) == 1
    assert ajuste_anio_actual[0].mes == 2
    assert ajuste_anio_actual[0].importe == Decimal("-5.00")
    assert len(ajuste_otro_anio) == 1
    assert ajuste_otro_anio[0].mes == 9
    assert ajuste_otro_anio[0].importe == Decimal("-7.00")
