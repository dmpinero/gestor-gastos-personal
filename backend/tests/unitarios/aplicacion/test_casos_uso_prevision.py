import datetime
from decimal import Decimal

import pytest

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.categoria.crear_subcategoria import CrearSubcategoria
from gestor_gastos.aplicacion.movimiento.crear_movimiento import CrearMovimiento
from gestor_gastos.aplicacion.prevision.actualizar_concepto_previsto import (
    ActualizarConceptoPrevisto,
)
from gestor_gastos.aplicacion.prevision.crear_concepto_previsto import CrearConceptoPrevisto
from gestor_gastos.aplicacion.prevision.eliminar_concepto_previsto import (
    EliminarConceptoPrevisto,
)
from gestor_gastos.aplicacion.prevision.listar_conceptos_previstos import (
    ListarConceptosPrevistos,
)
from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.excepciones import EntidadNoEncontradaError
from tests.unitarios.aplicacion.dobles import (
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
    categoria = CrearCategoria(repo_categorias).ejecutar("Suscripciones")
    return repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, categoria


def test_crear_concepto_previsto_mensual() -> None:
    repo_previsiones, repo_categorias, _, _, categoria = _preparar()

    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    assert concepto.id is not None
    assert concepto.categoria_id == categoria.id


def test_crear_concepto_previsto_con_categoria_inexistente_falla() -> None:
    repo_previsiones, repo_categorias, _, _, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
            categoria_id=999,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )


def test_crear_concepto_previsto_con_subcategoria_de_otra_categoria_falla() -> None:
    repo_previsiones, repo_categorias, _, _, categoria = _preparar()
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
    repo_previsiones, repo_categorias, _, _, categoria = _preparar()
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
    repo_previsiones, repo_categorias, _, _, categoria = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        ActualizarConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
            999,
            categoria_id=categoria.id,
            subcategoria_id=None,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )


def test_eliminar_concepto_previsto_inexistente_falla() -> None:
    repo_previsiones, _, _, _, _ = _preparar()

    with pytest.raises(EntidadNoEncontradaError):
        EliminarConceptoPrevisto(repo_previsiones).ejecutar(999)


def test_eliminar_concepto_previsto_lo_borra() -> None:
    repo_previsiones, repo_categorias, _, _, categoria = _preparar()
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    EliminarConceptoPrevisto(repo_previsiones).ejecutar(concepto.id)

    assert repo_previsiones.obtener_por_id(concepto.id) is None


def test_listar_conceptos_previstos() -> None:
    repo_previsiones, repo_categorias, _, _, categoria = _preparar()
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )

    assert len(ListarConceptosPrevistos(repo_previsiones).ejecutar()) == 1


def test_resumen_anual_usa_el_real_cuando_existe_y_el_previsto_en_el_resto_de_meses() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, repo_cuentas, categoria = _preparar()
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

    resumen = ObtenerResumenAnual(repo_previsiones, repo_categorias, repo_movimientos).ejecutar(
        2026
    )

    assert len(resumen.filas_gastos) == 1
    fila = resumen.filas_gastos[0]
    valor_marzo = next(v for v in fila.valores if v.mes == 3)
    valor_abril = next(v for v in fila.valores if v.mes == 4)
    assert valor_marzo.importe == Decimal("-4.99")
    assert valor_marzo.es_previsto is False
    assert valor_abril.importe == Decimal("-9.99")
    assert valor_abril.es_previsto is True
    assert resumen.totales_gastos[2] == Decimal("-4.99")  # índice 2 = marzo
    assert resumen.totales_gastos[3] == Decimal("-9.99")  # índice 3 = abril


def test_resumen_anual_concepto_anual_solo_aparece_en_su_mes() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, _, categoria = _preparar()
    CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=None,
        periodicidad="anual",
        importe_previsto=Decimal("-221.22"),
        mes_inicio=9,
    )

    resumen = ObtenerResumenAnual(repo_previsiones, repo_categorias, repo_movimientos).ejecutar(
        2026
    )

    fila = resumen.filas_gastos[0]
    meses_con_importe = {v.mes for v in fila.valores if v.importe != Decimal("0")}
    assert meses_con_importe == {9}


def test_resumen_anual_separa_gastos_e_ingresos_por_el_signo() -> None:
    repo_previsiones, repo_categorias, repo_movimientos, _, categoria = _preparar()
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

    resumen = ObtenerResumenAnual(repo_previsiones, repo_categorias, repo_movimientos).ejecutar(
        2026
    )

    assert len(resumen.filas_gastos) == 1
    assert len(resumen.filas_ingresos) == 1
    assert all(v.importe == Decimal("2000.00") for v in resumen.filas_ingresos[0].valores)
