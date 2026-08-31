import datetime
from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.categoria.crear_subcategoria import CrearSubcategoria
from gestor_gastos.aplicacion.movimiento.crear_movimiento import CrearMovimiento
from gestor_gastos.aplicacion.prevision.actualizar_concepto_previsto import (
    ActualizarConceptoPrevisto,
)
from gestor_gastos.aplicacion.prevision.ajustar_valor_mensual import AjustarValorMensual
from gestor_gastos.aplicacion.prevision.cargar_acumulado_real import CargarAcumuladoReal
from gestor_gastos.aplicacion.prevision.crear_concepto_previsto import CrearConceptoPrevisto
from gestor_gastos.aplicacion.prevision.eliminar_ajuste_mensual import EliminarAjusteMensual
from gestor_gastos.aplicacion.prevision.eliminar_concepto_previsto import (
    EliminarConceptoPrevisto,
)
from gestor_gastos.aplicacion.prevision.listar_conceptos_previstos import (
    ListarConceptosPrevistos,
)
from gestor_gastos.aplicacion.prevision.listar_movimientos_de_concepto import (
    ListarMovimientosDeConcepto,
)
from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from gestor_gastos.dominio.prevision.entidades import AsociacionConcepto, AsociacionDescripcion
from tests.unitarios.aplicacion.dobles import (
    RepositorioAjustesPrevisionFalso,
    RepositorioAsociacionesDescripcionFalso,
    RepositorioAsociacionesFalso,
    RepositorioCategoriasFalso,
    RepositorioCuentasFalso,
    RepositorioMovimientosFalso,
    RepositorioPrevisionesFalso,
)


def _preparar():
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_cuentas = RepositorioCuentasFalso()
    repo_ajustes = RepositorioAjustesPrevisionFalso()
    categoria = CrearCategoria(repo_categorias).ejecutar("Suscripciones")
    return (
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_cuentas,
        repo_ajustes,
        categoria,
    )


def test_crear_concepto_previsto_mensual() -> None:
    repo_previsiones, repo_categorias, _, _, _, categoria = _preparar()

    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    assert concepto.id is not None
    assert concepto.categoria_id == categoria.id


def test_crear_concepto_previsto_con_categoria_inexistente_falla() -> None:
    repo_previsiones, repo_categorias, _, _, _, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
            categoria_id=999,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )


def test_crear_concepto_previsto_con_subcategoria_de_otra_categoria_falla() -> None:
    repo_previsiones, repo_categorias, _, _, _, categoria = _preparar()
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Hogar")
    subcategoria_de_otra = CrearSubcategoria(repo_categorias).ejecutar(
        otra_categoria.id, "Comunidad"
    )

    with pytest.raises(EntidadNoEncontradaError):
        CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
            categoria_id=categoria.id,
            subcategoria_id=subcategoria_de_otra.id,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )


def test_actualizar_concepto_previsto_cambia_periodicidad_e_importe() -> None:
    repo_previsiones, repo_categorias, _, _, _, categoria = _preparar()
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    actualizado = ActualizarConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        concepto.id,
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="anual",
        importe_previsto=Decimal("-120.00"),
        mes_inicio=3,
    )

    assert actualizado.periodicidad == "anual"
    assert actualizado.mes_inicio == 3
    assert actualizado.importe_previsto == Decimal("-120.00")


def test_actualizar_concepto_previsto_inexistente_falla() -> None:
    repo_previsiones, repo_categorias, _, _, _, categoria = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        ActualizarConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
            999,
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )


def test_eliminar_concepto_previsto_inexistente_falla() -> None:
    repo_previsiones, _, _, _, _, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        EliminarConceptoPrevisto(repo_previsiones).ejecutar(999)


def test_eliminar_concepto_previsto_lo_borra() -> None:
    repo_previsiones, repo_categorias, _, _, _, categoria = _preparar()
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    EliminarConceptoPrevisto(repo_previsiones).ejecutar(concepto.id)

    assert repo_previsiones.obtener_por_id(concepto.id) is None


def test_listar_conceptos_previstos() -> None:
    repo_previsiones, repo_categorias, _, _, _, categoria = _preparar()
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    assert len(ListarConceptosPrevistos(repo_previsiones).ejecutar()) == 1


def test_resumen_anual_usa_el_real_cuando_existe_y_el_previsto_en_el_resto_de_meses() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, categoria = (
        _preparar()
    )
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=categoria.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Amazon Prime",
        importe=Decimal("-4.99"),
        saldo=Decimal("100.00"),
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(2026)

    assert len(resumen.filas_gastos) == 1
    fila = resumen.filas_gastos[0]
    valor_marzo = next(v for v in fila.valores if v.mes == 3)
    valor_abril = next(v for v in fila.valores if v.mes == 4)
    assert valor_marzo.importe == Decimal("-4.99")
    assert valor_marzo.origen == "real"
    assert valor_abril.importe == Decimal("-9.99")
    assert valor_abril.origen == "previsto"
    assert resumen.totales_gastos[2] == Decimal("-4.99")  # índice 2 = marzo
    assert resumen.totales_gastos[3] == Decimal("-9.99")  # índice 3 = abril


def test_resumen_anual_con_asociacion_busca_el_real_en_la_categoria_de_movimientos_mapeada() -> (
    None
):
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, comida = (
        _preparar()
    )
    alimentacion = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    # El concepto se nombra "Comida" en el resumen anual, pero el movimiento
    # real está categorizado como "Alimentación": sin la asociación, nunca se
    # encontrarían (ver test siguiente).
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=comida.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-200.00"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=alimentacion.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Supermercado",
        importe=Decimal("-150.00"),
        saldo=Decimal("100.00"),
    )
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=alimentacion.id,
            subcategoria_movimiento_id=None,
        )
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        repo_asociaciones,
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(2026)

    fila = resumen.filas_gastos[0]
    valor_marzo = next(v for v in fila.valores if v.mes == 3)
    assert valor_marzo.importe == Decimal("-150.00")
    assert valor_marzo.origen == "real"


def test_resumen_anual_sin_asociacion_no_encuentra_el_real_de_otra_categoria() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, comida = (
        _preparar()
    )
    alimentacion = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=comida.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-200.00"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=alimentacion.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Supermercado",
        importe=Decimal("-150.00"),
        saldo=Decimal("100.00"),
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(2026)

    fila = resumen.filas_gastos[0]
    valor_marzo = next(v for v in fila.valores if v.mes == 3)
    assert valor_marzo.importe == Decimal("-200.00")
    assert valor_marzo.origen == "previsto"


def test_resumen_anual_con_asociacion_descripcion_suma_el_real_al_de_la_categoria() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, comida = (
        _preparar()
    )
    alimentacion = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=comida.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-200.00"),
    )
    # Un movimiento en la categoría asociada por AsociacionConcepto...
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=alimentacion.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Supermercado",
        importe=Decimal("-150.00"),
        saldo=Decimal("100.00"),
    )
    # ...y otro suelto, en una categoría distinta, que solo se rescata por su
    # descripción (AsociacionDescripcion): el real del concepto es la suma.
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Varios")
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=otra_categoria.id,
        fecha_valor=datetime.date(2026, 3, 20),
        descripcion="Reembolso comida trabajo",
        importe=Decimal("-25.00"),
        saldo=Decimal("75.00"),
    )
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=alimentacion.id,
            subcategoria_movimiento_id=None,
        )
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            descripcion="comida trabajo",
        )
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        repo_asociaciones,
        repo_asociaciones_descripcion,
    ).ejecutar(2026)

    fila = resumen.filas_gastos[0]
    valor_marzo = next(v for v in fila.valores if v.mes == 3)
    assert valor_marzo.importe == Decimal("-175.00")
    assert valor_marzo.origen == "real"


def test_resumen_anual_no_duplica_un_movimiento_que_coincide_por_categoria_y_por_descripcion() -> (
    None
):
    # Regresión: un movimiento en la propia categoría del concepto, cuya
    # descripción TAMBIÉN coincide con una AsociacionDescripcion del mismo
    # concepto, se sumaba dos veces (una por categoría, otra por
    # descripción) — el real mostrado no coincidía con la suma de los
    # movimientos realmente listados en el detalle.
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, bizum = (
        _preparar()
    )
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=bizum.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-100.00"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=bizum.id,
        fecha_valor=datetime.date(2026, 1, 5),
        descripcion="Bizum enviado a Sonia",
        importe=Decimal("-50.00"),
        saldo=Decimal("100.00"),
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=bizum.id,
            subcategoria_resumen_id=None,
            descripcion="Bizum enviado",
        )
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        repo_asociaciones_descripcion,
    ).ejecutar(2026)

    fila = resumen.filas_gastos[0]
    valor_enero = next(v for v in fila.valores if v.mes == 1)
    assert valor_enero.importe == Decimal("-50.00")


def test_resumen_anual_con_asociacion_de_categoria_no_duplica_un_movimiento_que_tambien_coincide_por_descripcion() -> (  # noqa: E501
    None
):
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, comida = (
        _preparar()
    )
    alimentacion = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=comida.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-200.00"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=alimentacion.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Supermercado Bizum",
        importe=Decimal("-150.00"),
        saldo=Decimal("100.00"),
    )
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=alimentacion.id,
            subcategoria_movimiento_id=None,
        )
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            descripcion="Bizum",
        )
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        repo_asociaciones,
        repo_asociaciones_descripcion,
    ).ejecutar(2026)

    fila = resumen.filas_gastos[0]
    valor_marzo = next(v for v in fila.valores if v.mes == 3)
    assert valor_marzo.importe == Decimal("-150.00")


def test_resumen_anual_con_asociacion_descripcion_sin_categoria_asociada_encuentra_el_real() -> (
    None
):
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, varios = (
        _preparar()
    )
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=varios.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Otra")
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=otra_categoria.id,
        fecha_valor=datetime.date(2026, 3, 20),
        descripcion="Recibo Ayuntamiento Las Rozas",
        importe=Decimal("-40.00"),
        saldo=Decimal("60.00"),
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=varios.id,
            subcategoria_resumen_id=None,
            descripcion="Ayuntamiento Las Rozas",
        )
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        repo_asociaciones_descripcion,
    ).ejecutar(2026)

    fila = resumen.filas_gastos[0]
    valor_marzo = next(v for v in fila.valores if v.mes == 3)
    assert valor_marzo.importe == Decimal("-40.00")
    assert valor_marzo.origen == "real"


def test_resumen_anual_concepto_anual_solo_aparece_en_su_mes() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, _, repo_ajustes, categoria = _preparar()
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="anual",
        importe_previsto=Decimal("-221.22"),
        mes_inicio=9,
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(2026)

    fila = resumen.filas_gastos[0]
    meses_con_importe = {v.mes for v in fila.valores if v.importe != Decimal("0")}
    assert meses_con_importe == {9}


def test_resumen_anual_separa_gastos_e_ingresos_por_el_signo() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, _, repo_ajustes, categoria = _preparar()
    nomina = CrearCategoria(repo_categorias).ejecutar("Nómina")
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=nomina.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("2000.00"),
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(2026)

    assert len(resumen.filas_gastos) == 1
    assert len(resumen.filas_ingresos) == 1
    assert all(v.importe == Decimal("2000.00") for v in resumen.filas_ingresos[0].valores)


def test_ajustar_valor_mensual_crea_el_ajuste() -> None:
    repo_previsiones, repo_categorias, _, _, repo_ajustes, categoria = _preparar()
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    ajuste = AjustarValorMensual(repo_previsiones, repo_ajustes).ejecutar(
        concepto.id, 2026, 5, Decimal("-30.00")
    )

    assert ajuste.importe == Decimal("-30.00")
    assert repo_ajustes.listar_por_anio(2026) == [ajuste]


def test_ajustar_valor_mensual_dos_veces_actualiza_el_mismo_ajuste() -> None:
    repo_previsiones, repo_categorias, _, _, repo_ajustes, categoria = _preparar()
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    AjustarValorMensual(repo_previsiones, repo_ajustes).ejecutar(
        concepto.id, 2026, 5, Decimal("-30.00")
    )
    AjustarValorMensual(repo_previsiones, repo_ajustes).ejecutar(
        concepto.id, 2026, 5, Decimal("-45.00")
    )

    ajustes = repo_ajustes.listar_por_anio(2026)
    assert len(ajustes) == 1
    assert ajustes[0].importe == Decimal("-45.00")


def test_ajustar_valor_mensual_con_concepto_inexistente_falla() -> None:
    repo_previsiones, _, _, _, repo_ajustes, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        AjustarValorMensual(repo_previsiones, repo_ajustes).ejecutar(
            999, 2026, 5, Decimal("-30.00")
        )


def test_eliminar_ajuste_mensual_lo_borra() -> None:
    repo_previsiones, repo_categorias, _, _, repo_ajustes, categoria = _preparar()
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    AjustarValorMensual(repo_previsiones, repo_ajustes).ejecutar(
        concepto.id, 2026, 5, Decimal("-30.00")
    )

    EliminarAjusteMensual(repo_previsiones, repo_ajustes).ejecutar(concepto.id, 2026, 5)

    assert repo_ajustes.listar_por_anio(2026) == []


def test_eliminar_ajuste_mensual_es_idempotente_si_no_existia() -> None:
    repo_previsiones, repo_categorias, _, _, repo_ajustes, categoria = _preparar()
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    EliminarAjusteMensual(repo_previsiones, repo_ajustes).ejecutar(concepto.id, 2026, 5)


def test_eliminar_ajuste_mensual_con_concepto_inexistente_falla() -> None:
    repo_previsiones, _, _, _, repo_ajustes, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        EliminarAjusteMensual(repo_previsiones, repo_ajustes).ejecutar(999, 2026, 5)


def test_resumen_anual_un_ajuste_tiene_prioridad_sobre_el_real_y_el_previsto() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, categoria = (
        _preparar()
    )
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=categoria.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Amazon Prime",
        importe=Decimal("-4.99"),
        saldo=Decimal("100.00"),
    )
    AjustarValorMensual(repo_previsiones, repo_ajustes).ejecutar(
        concepto.id, 2026, 3, Decimal("-1.00")
    )
    AjustarValorMensual(repo_previsiones, repo_ajustes).ejecutar(
        concepto.id, 2026, 4, Decimal("-2.00")
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(2026)

    fila = resumen.filas_gastos[0]
    valor_marzo = next(v for v in fila.valores if v.mes == 3)
    valor_abril = next(v for v in fila.valores if v.mes == 4)
    assert valor_marzo.importe == Decimal("-1.00")
    assert valor_marzo.origen == "ajustado"
    assert valor_abril.importe == Decimal("-2.00")
    assert valor_abril.origen == "ajustado"


def test_resumen_anual_un_ajuste_en_un_mes_no_aplicable_lo_muestra_igualmente() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, _, repo_ajustes, categoria = _preparar()
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="anual",
        importe_previsto=Decimal("-221.22"),
        mes_inicio=9,
    )
    AjustarValorMensual(repo_previsiones, repo_ajustes).ejecutar(
        concepto.id, 2026, 6, Decimal("-15.00")
    )

    resumen = ObtenerResumenAnual(
        repo_previsiones,
        repo_categorias,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(2026)

    fila = resumen.filas_gastos[0]
    valor_junio = next(v for v in fila.valores if v.mes == 6)
    assert valor_junio.importe == Decimal("-15.00")
    assert valor_junio.origen == "ajustado"


def test_cargar_acumulado_real_crea_ajustes_para_los_meses_con_movimientos() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, categoria = (
        _preparar()
    )
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=categoria.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Amazon Prime",
        importe=Decimal("-4.99"),
        saldo=Decimal("100.00"),
    )

    meses_actualizados = CargarAcumuladoReal(
        repo_previsiones,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(concepto.id, 2026)

    assert meses_actualizados == 1
    ajustes = repo_ajustes.listar_por_anio(2026)
    assert len(ajustes) == 1
    assert ajustes[0].mes == 3
    assert ajustes[0].importe == Decimal("-4.99")


def test_cargar_acumulado_real_sobrescribe_un_ajuste_manual_existente() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, categoria = (
        _preparar()
    )
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=categoria.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Amazon Prime",
        importe=Decimal("-4.99"),
        saldo=Decimal("100.00"),
    )
    AjustarValorMensual(repo_previsiones, repo_ajustes).ejecutar(
        concepto.id, 2026, 3, Decimal("-1.00")
    )

    meses_actualizados = CargarAcumuladoReal(
        repo_previsiones,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(concepto.id, 2026)

    assert meses_actualizados == 1
    ajustes = repo_ajustes.listar_por_anio(2026)
    assert len(ajustes) == 1
    assert ajustes[0].importe == Decimal("-4.99")


def test_cargar_acumulado_real_no_toca_meses_sin_movimientos() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, _, repo_ajustes, categoria = _preparar()
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    meses_actualizados = CargarAcumuladoReal(
        repo_previsiones,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(concepto.id, 2026)

    assert meses_actualizados == 0
    assert repo_ajustes.listar_por_anio(2026) == []


def test_cargar_acumulado_real_usa_asociacion_por_categoria_y_por_descripcion() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, comida = (
        _preparar()
    )
    alimentacion = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Varios")
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=comida.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-200.00"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=alimentacion.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Supermercado",
        importe=Decimal("-150.00"),
        saldo=Decimal("100.00"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=otra_categoria.id,
        fecha_valor=datetime.date(2026, 3, 20),
        descripcion="Reembolso comida trabajo",
        importe=Decimal("-25.00"),
        saldo=Decimal("75.00"),
    )
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=alimentacion.id,
            subcategoria_movimiento_id=None,
        )
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            descripcion="comida trabajo",
        )
    )

    CargarAcumuladoReal(
        repo_previsiones,
        repo_movimientos,
        repo_ajustes,
        repo_asociaciones,
        repo_asociaciones_descripcion,
    ).ejecutar(concepto.id, 2026)

    ajustes = repo_ajustes.listar_por_anio(2026)
    assert len(ajustes) == 1
    assert ajustes[0].importe == Decimal("-175.00")


def test_cargar_acumulado_real_no_duplica_un_movimiento_que_coincide_por_categoria_y_por_descripcion() -> (  # noqa: E501
    None
):
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, repo_ajustes, bizum = (
        _preparar()
    )
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=bizum.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-100.00"),
    )
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=bizum.id,
        fecha_valor=datetime.date(2026, 1, 5),
        descripcion="Bizum enviado a Sonia",
        importe=Decimal("-50.00"),
        saldo=Decimal("100.00"),
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=bizum.id,
            subcategoria_resumen_id=None,
            descripcion="Bizum enviado",
        )
    )

    CargarAcumuladoReal(
        repo_previsiones,
        repo_movimientos,
        repo_ajustes,
        RepositorioAsociacionesFalso(),
        repo_asociaciones_descripcion,
    ).ejecutar(concepto.id, 2026)

    ajustes = repo_ajustes.listar_por_anio(2026)
    assert len(ajustes) == 1
    assert ajustes[0].importe == Decimal("-50.00")


def test_cargar_acumulado_real_con_concepto_inexistente_falla() -> None:
    repo_previsiones, _, repo_movimientos, _, repo_ajustes, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        CargarAcumuladoReal(
            repo_previsiones,
            repo_movimientos,
            repo_ajustes,
            RepositorioAsociacionesFalso(),
            RepositorioAsociacionesDescripcionFalso(),
        ).ejecutar(999, 2026)


def test_listar_movimientos_de_concepto_usa_la_categoria_real_de_la_asociacion() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, _, comida = _preparar()
    alimentacion = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=comida.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-200.00"),
    )
    movimiento = CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=alimentacion.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Supermercado",
        importe=Decimal("-150.00"),
        saldo=Decimal("100.00"),
    )
    # Un movimiento del mes/año equivocado no debe aparecer.
    CrearMovimiento(repo_movimientos, repo_cuentas, repo_categorias).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=alimentacion.id,
        fecha_valor=datetime.date(2026, 4, 1),
        descripcion="Supermercado abril",
        importe=Decimal("-30.00"),
        saldo=Decimal("70.00"),
    )
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=alimentacion.id,
            subcategoria_movimiento_id=None,
        )
    )

    movimientos = ListarMovimientosDeConcepto(
        repo_previsiones,
        repo_movimientos,
        repo_asociaciones,
        RepositorioAsociacionesDescripcionFalso(),
    ).ejecutar(concepto.id, 2026, 3)

    assert [m.id for m in movimientos] == [movimiento.id]


def test_listar_movimientos_de_concepto_incluye_los_de_descripcion_sin_duplicar() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, _, comida = _preparar()
    alimentacion = CrearCategoria(repo_categorias).ejecutar("Alimentación")
    otra_categoria = CrearCategoria(repo_categorias).ejecutar("Varios")
    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=comida.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-200.00"),
    )
    # Este movimiento coincide con la categoría asociada Y con la
    # descripción asociada: no debe aparecer duplicado.
    movimiento_categoria = CrearMovimiento(
        repo_movimientos, repo_cuentas, repo_categorias
    ).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=alimentacion.id,
        fecha_valor=datetime.date(2026, 3, 15),
        descripcion="Supermercado comida trabajo",
        importe=Decimal("-150.00"),
        saldo=Decimal("100.00"),
    )
    movimiento_descripcion = CrearMovimiento(
        repo_movimientos, repo_cuentas, repo_categorias
    ).ejecutar(
        cuenta_id=cuenta.id,
        categoria_id=otra_categoria.id,
        fecha_valor=datetime.date(2026, 3, 20),
        descripcion="Reembolso comida trabajo",
        importe=Decimal("-25.00"),
        saldo=Decimal("75.00"),
    )
    repo_asociaciones = RepositorioAsociacionesFalso()
    repo_asociaciones.crear(
        AsociacionConcepto(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            categoria_movimiento_id=alimentacion.id,
            subcategoria_movimiento_id=None,
        )
    )
    repo_asociaciones_descripcion = RepositorioAsociacionesDescripcionFalso()
    repo_asociaciones_descripcion.crear(
        AsociacionDescripcion(
            categoria_resumen_id=comida.id,
            subcategoria_resumen_id=None,
            descripcion="comida trabajo",
        )
    )

    movimientos = ListarMovimientosDeConcepto(
        repo_previsiones,
        repo_movimientos,
        repo_asociaciones,
        repo_asociaciones_descripcion,
    ).ejecutar(concepto.id, 2026, 3)

    assert {m.id for m in movimientos} == {movimiento_categoria.id, movimiento_descripcion.id}
    assert len(movimientos) == 2


def test_listar_movimientos_de_concepto_con_concepto_inexistente_falla() -> None:
    repo_previsiones, _, repo_movimientos, _, _, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        ListarMovimientosDeConcepto(
            repo_previsiones,
            repo_movimientos,
            RepositorioAsociacionesFalso(),
            RepositorioAsociacionesDescripcionFalso(),
        ).ejecutar(999, 2026, 3)
