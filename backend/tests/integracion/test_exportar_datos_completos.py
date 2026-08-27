import datetime
import io
from decimal import Decimal

import openpyxl

from gestor_gastos.aplicacion.categoria.listar_categorias import ListarCategorias
from gestor_gastos.aplicacion.cuenta.listar_cuentas import ListarCuentas
from gestor_gastos.aplicacion.exportacion.exportar_datos_completos import ExportarDatosCompletos
from gestor_gastos.aplicacion.movimiento.listar_todos_los_movimientos import (
    ListarTodosLosMovimientos,
)
from gestor_gastos.aplicacion.prevision.listar_conceptos_previstos import (
    ListarConceptosPrevistos,
)
from gestor_gastos.aplicacion.prevision.listar_todos_los_ajustes import ListarTodosLosAjustes
from gestor_gastos.dominio.categoria.entidades import Categoria, Subcategoria
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.prevision.entidades import AjusteMensual, ConceptoPrevisto
from gestor_gastos.infraestructura.exportacion.escritor_exportacion_completa_openpyxl import (
    EscritorExportacionCompletaOpenpyxl,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_ajustes_prevision_sqlalchemy import (  # noqa: E501
    RepositorioAjustesPrevisionSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_cuentas_sqlalchemy import (  # noqa: E501
    RepositorioCuentasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)


def test_exporta_datos_reales_de_las_seis_tablas_a_un_excel_valido(sesion_bd) -> None:
    repo_cuentas = RepositorioCuentasSqlAlchemy(sesion_bd)
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)
    repo_previsiones = RepositorioPrevisionesSqlAlchemy(sesion_bd)
    repo_ajustes = RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)

    cuenta = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 1234"))
    categoria = repo_categorias.crear_categoria(Categoria(nombre="Suscripciones"))
    subcategoria = repo_categorias.crear_subcategoria(
        Subcategoria(categoria_id=categoria.id, nombre="Streaming")
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
    concepto = repo_previsiones.crear(
        ConceptoPrevisto(
            categoria_id=categoria.id,
            subcategoria_id=subcategoria.id,
            periodicidad="mensual",
            importe_previsto=Decimal("-9.99"),
        )
    )
    repo_ajustes.guardar(
        AjusteMensual(concepto_id=concepto.id, anio=2026, mes=3, importe=Decimal("-12.00"))
    )

    contenido = ExportarDatosCompletos(
        ListarCuentas(repo_cuentas),
        ListarCategorias(repo_categorias),
        ListarTodosLosMovimientos(repo_movimientos),
        ListarConceptosPrevistos(repo_previsiones),
        ListarTodosLosAjustes(repo_ajustes),
        EscritorExportacionCompletaOpenpyxl(),
    ).ejecutar()

    libro = openpyxl.load_workbook(io.BytesIO(contenido))
    assert libro.sheetnames == [
        "Cuentas",
        "Categorías",
        "Subcategorías",
        "Movimientos",
        "Conceptos previstos",
        "Ajustes mensuales",
    ]
    assert libro["Cuentas"]["B2"].value == "ES00 1234"
    assert libro["Movimientos"]["F2"].value == "Netflix"
