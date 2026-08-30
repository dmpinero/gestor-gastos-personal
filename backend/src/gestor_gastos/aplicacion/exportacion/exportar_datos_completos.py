from gestor_gastos.aplicacion.categoria.listar_categorias import ListarCategorias
from gestor_gastos.aplicacion.cuenta.listar_cuentas import ListarCuentas
from gestor_gastos.aplicacion.movimiento.listar_todos_los_movimientos import (
    ListarTodosLosMovimientos,
)
from gestor_gastos.aplicacion.prevision.listar_asociaciones import ListarAsociaciones
from gestor_gastos.aplicacion.prevision.listar_conceptos_previstos import (
    ListarConceptosPrevistos,
)
from gestor_gastos.aplicacion.prevision.listar_todos_los_ajustes import ListarTodosLosAjustes
from gestor_gastos.dominio.exportacion.escritor_exportacion_completa import (
    EscritorExportacionCompleta,
)
from gestor_gastos.dominio.exportacion.valores import DatosCompletos


class ExportarDatosCompletos:
    def __init__(
        self,
        listar_cuentas: ListarCuentas,
        listar_categorias: ListarCategorias,
        listar_movimientos: ListarTodosLosMovimientos,
        listar_conceptos_previstos: ListarConceptosPrevistos,
        listar_ajustes: ListarTodosLosAjustes,
        listar_asociaciones: ListarAsociaciones,
        escritor: EscritorExportacionCompleta,
    ) -> None:
        self._listar_cuentas = listar_cuentas
        self._listar_categorias = listar_categorias
        self._listar_movimientos = listar_movimientos
        self._listar_conceptos_previstos = listar_conceptos_previstos
        self._listar_ajustes = listar_ajustes
        self._listar_asociaciones = listar_asociaciones
        self._escritor = escritor

    def ejecutar(self) -> bytes:
        categorias_con_subcategorias = self._listar_categorias.ejecutar()
        datos = DatosCompletos(
            cuentas=self._listar_cuentas.ejecutar(),
            categorias=[c.categoria for c in categorias_con_subcategorias],
            subcategorias=[
                subcategoria
                for c in categorias_con_subcategorias
                for subcategoria in c.subcategorias
            ],
            movimientos=self._listar_movimientos.ejecutar(),
            conceptos_previstos=self._listar_conceptos_previstos.ejecutar(),
            ajustes=self._listar_ajustes.ejecutar(),
            asociaciones=self._listar_asociaciones.ejecutar(),
        )
        return self._escritor.escribir(datos)
