import datetime
from decimal import Decimal

from gestor_gastos.aplicacion.categoria.listar_categorias import ListarCategorias
from gestor_gastos.aplicacion.cuenta.listar_cuentas import ListarCuentas
from gestor_gastos.aplicacion.exportacion.exportar_datos_completos import ExportarDatosCompletos
from gestor_gastos.aplicacion.exportacion.importar_datos_completos import ImportarDatosCompletos
from gestor_gastos.aplicacion.movimiento.listar_todos_los_movimientos import (
    ListarTodosLosMovimientos,
)
from gestor_gastos.aplicacion.prevision.listar_conceptos_previstos import (
    ListarConceptosPrevistos,
)
from gestor_gastos.aplicacion.prevision.listar_todos_los_ajustes import ListarTodosLosAjustes
from gestor_gastos.dominio.categoria.entidades import Categoria
from gestor_gastos.dominio.cuenta.entidades import CuentaBancaria
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.infraestructura.exportacion.escritor_exportacion_completa_openpyxl import (
    EscritorExportacionCompletaOpenpyxl,
)
from gestor_gastos.infraestructura.exportacion.lector_exportacion_completa_openpyxl import (
    LectorExportacionCompletaOpenpyxl,
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
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_importacion_completa_sqlalchemy import (  # noqa: E501
    RepositorioImportacionCompletaSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)


def _exportar(sesion_bd) -> bytes:
    return ExportarDatosCompletos(
        ListarCuentas(RepositorioCuentasSqlAlchemy(sesion_bd)),
        ListarCategorias(RepositorioCategoriasSqlAlchemy(sesion_bd)),
        ListarTodosLosMovimientos(RepositorioMovimientosSqlAlchemy(sesion_bd)),
        ListarConceptosPrevistos(RepositorioPrevisionesSqlAlchemy(sesion_bd)),
        ListarTodosLosAjustes(RepositorioAjustesPrevisionSqlAlchemy(sesion_bd)),
        EscritorExportacionCompletaOpenpyxl(),
    ).ejecutar()


def test_importar_un_backup_sustituye_todos_los_datos_existentes(sesion_bd) -> None:
    repo_cuentas = RepositorioCuentasSqlAlchemy(sesion_bd)
    repo_categorias = RepositorioCategoriasSqlAlchemy(sesion_bd)
    repo_movimientos = RepositorioMovimientosSqlAlchemy(sesion_bd)

    cuenta_original = repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 ORIGINAL"))
    categoria_original = repo_categorias.crear_categoria(Categoria(nombre="Original"))
    repo_movimientos.crear(
        Movimiento(
            cuenta_id=cuenta_original.id,
            categoria_id=categoria_original.id,
            fecha_valor=datetime.date(2026, 1, 1),
            descripcion="Movimiento original",
            importe=Decimal("-5.00"),
            saldo=Decimal("95.00"),
        )
    )
    contenido_backup = _exportar(sesion_bd)

    repo_cuentas.crear(CuentaBancaria(numero_cuenta="ES00 NUEVA"))
    repo_categorias.crear_categoria(Categoria(nombre="Nueva"))

    resumen = ImportarDatosCompletos(
        LectorExportacionCompletaOpenpyxl(),
        RepositorioImportacionCompletaSqlAlchemy(sesion_bd),
    ).ejecutar(contenido_backup, "backup-gestor-gastos.xlsx")

    assert resumen.cuentas_importadas == 1
    assert resumen.categorias_importadas == 1
    assert resumen.movimientos_importados == 1

    cuentas_finales = repo_cuentas.listar()
    assert [c.numero_cuenta for c in cuentas_finales] == ["ES00 ORIGINAL"]
    categorias_finales = repo_categorias.listar_categorias()
    assert [c.nombre for c in categorias_finales] == ["Original"]
    movimientos_finales = repo_movimientos.listar_todos()
    assert [m.descripcion for m in movimientos_finales] == ["Movimiento original"]
    assert cuentas_finales[0].id == cuenta_original.id
