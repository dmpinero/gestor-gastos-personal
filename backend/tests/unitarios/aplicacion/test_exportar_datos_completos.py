import datetime
from decimal import Decimal

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.categoria.crear_subcategoria import CrearSubcategoria
from gestor_gastos.aplicacion.categoria.listar_categorias import ListarCategorias
from gestor_gastos.aplicacion.cuenta.crear_cuenta import CrearCuenta
from gestor_gastos.aplicacion.cuenta.listar_cuentas import ListarCuentas
from gestor_gastos.aplicacion.exportacion.exportar_datos_completos import ExportarDatosCompletos
from gestor_gastos.aplicacion.movimiento.listar_todos_los_movimientos import (
    ListarTodosLosMovimientos,
)
from gestor_gastos.aplicacion.prevision.crear_asociacion import CrearAsociacion
from gestor_gastos.aplicacion.prevision.crear_concepto_previsto import CrearConceptoPrevisto
from gestor_gastos.aplicacion.prevision.listar_asociaciones import ListarAsociaciones
from gestor_gastos.aplicacion.prevision.listar_conceptos_previstos import (
    ListarConceptosPrevistos,
)
from gestor_gastos.aplicacion.prevision.listar_todos_los_ajustes import ListarTodosLosAjustes
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.prevision.entidades import AjusteMensual
from tests.unitarios.aplicacion.dobles import (
    EscritorExportacionCompletaFalso,
    RepositorioAjustesPrevisionFalso,
    RepositorioAsociacionesFalso,
    RepositorioCategoriasFalso,
    RepositorioCuentasFalso,
    RepositorioMovimientosFalso,
    RepositorioPrevisionesFalso,
)


def test_exportar_delega_los_datos_de_las_seis_tablas_en_el_escritor() -> None:
    repo_cuentas = RepositorioCuentasFalso()
    repo_categorias = RepositorioCategoriasFalso()
    repo_movimientos = RepositorioMovimientosFalso()
    repo_previsiones = RepositorioPrevisionesFalso()
    repo_ajustes = RepositorioAjustesPrevisionFalso()
    repo_asociaciones = RepositorioAsociacionesFalso()

    cuenta = CrearCuenta(repo_cuentas).ejecutar("ES00 1234")
    categoria = CrearCategoria(repo_categorias).ejecutar("Suscripciones")
    subcategoria = CrearSubcategoria(repo_categorias).ejecutar(categoria.id, "Streaming")
    categoria_resumen = CrearCategoria(repo_categorias).ejecutar("Ocio")
    CrearAsociacion(repo_asociaciones, repo_categorias).ejecutar(
        categoria_resumen_id=categoria_resumen.id,
        subcategoria_resumen_id=None,
        categoria_movimiento_id=categoria.id,
        subcategoria_movimiento_id=subcategoria.id,
    )
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=cuenta.id,
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            fecha_valor=datetime.date(2026, 3, 15),
            descripcion="Netflix",
            importe=Decimal("-9.99"),
            saldo=Decimal("100.00"),
        )
    )
    concepto = CrearConceptoPrevisto(repo_previsiones, repo_categorias).ejecutar(
        categoria_id=categoria.id,
        subcategoria_id=subcategoria.id,
        periodicidad="mensual",
        importe_previsto=Decimal("-9.99"),
    )
    repo_ajustes.guardar(
        AjusteMensual(concepto_id=concepto.id, anio=2026, mes=3, importe=Decimal("-12.00"))
    )
    escritor = EscritorExportacionCompletaFalso()

    contenido = ExportarDatosCompletos(
        ListarCuentas(repo_cuentas),
        ListarCategorias(repo_categorias),
        ListarTodosLosMovimientos(repo_movimientos),
        ListarConceptosPrevistos(repo_previsiones),
        ListarTodosLosAjustes(repo_ajustes),
        ListarAsociaciones(repo_asociaciones),
        escritor,
    ).ejecutar()

    assert contenido == b"contenido-falso"
    datos = escritor.datos_recibidos
    assert len(datos.cuentas) == 1
    assert len(datos.categorias) == 2
    assert len(datos.subcategorias) == 1
    assert len(datos.movimientos) == 1
    assert len(datos.conceptos_previstos) == 1
    assert len(datos.ajustes) == 1
    assert len(datos.asociaciones) == 1
