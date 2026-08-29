from decimal import Decimal

from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos
from gestor_gastos.dominio.prevision.repositorio import (
    RepositorioAjustesMensuales,
    RepositorioAsociaciones,
    RepositorioPrevisiones,
)
from gestor_gastos.dominio.prevision.valores import FilaResumenAnual, ResumenAnual, ValorMensual


class ObtenerResumenAnual:
    def __init__(
        self,
        repositorio: RepositorioPrevisiones,
        repositorio_categorias: RepositorioCategorias,
        repositorio_movimientos: RepositorioMovimientos,
        repositorio_ajustes: RepositorioAjustesMensuales,
        repositorio_asociaciones: RepositorioAsociaciones,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_categorias = repositorio_categorias
        self._repositorio_movimientos = repositorio_movimientos
        self._repositorio_ajustes = repositorio_ajustes
        self._repositorio_asociaciones = repositorio_asociaciones

    def ejecutar(self, anio: int) -> ResumenAnual:
        conceptos = self._repositorio.listar()
        sumas_reales = self._repositorio_movimientos.sumar_movimientos_por_mes(anio)
        ajustes = {
            (a.concepto_id, a.mes): a.importe
            for a in self._repositorio_ajustes.listar_por_anio(anio)
        }
        # Una asociación hace corresponder la categoría/subcategoría con la
        # que se nombra un concepto en el resumen anual con la categoría/
        # subcategoría real que usan los movimientos (ver AsociacionConcepto).
        asociaciones = {
            (a.categoria_resumen_id, a.subcategoria_resumen_id): (
                a.categoria_movimiento_id,
                a.subcategoria_movimiento_id,
            )
            for a in self._repositorio_asociaciones.listar()
        }

        filas_gastos: list[FilaResumenAnual] = []
        filas_ingresos: list[FilaResumenAnual] = []
        totales_gastos = [Decimal("0")] * 12
        totales_ingresos = [Decimal("0")] * 12

        for concepto in conceptos:
            meses_aplicables = concepto.meses_aplicables()
            categoria_real, subcategoria_real = asociaciones.get(
                (concepto.categoria_id, concepto.subcategoria_id),
                (concepto.categoria_id, concepto.subcategoria_id),
            )
            valores: list[ValorMensual] = []
            for mes in range(1, 13):
                ajuste = ajustes.get((concepto.id, mes))
                clave = (categoria_real, subcategoria_real, mes)
                real = sumas_reales.get(clave)
                if ajuste is not None:
                    valores.append(ValorMensual(mes=mes, importe=ajuste, origen="ajustado"))
                elif real is not None:
                    valores.append(ValorMensual(mes=mes, importe=real, origen="real"))
                elif mes in meses_aplicables:
                    valores.append(
                        ValorMensual(mes=mes, importe=concepto.importe_previsto, origen="previsto")
                    )
                else:
                    valores.append(ValorMensual(mes=mes, importe=Decimal("0"), origen="real"))

            fila = FilaResumenAnual(
                concepto_id=concepto.id,
                categoria_id=concepto.categoria_id,
                subcategoria_id=concepto.subcategoria_id,
                nombre=self._nombre_de(concepto.categoria_id, concepto.subcategoria_id),
                periodicidad=concepto.periodicidad,
                valores=valores,
            )

            totales = totales_gastos if concepto.importe_previsto < 0 else totales_ingresos
            (filas_gastos if concepto.importe_previsto < 0 else filas_ingresos).append(fila)
            for indice, valor in enumerate(valores):
                totales[indice] += valor.importe

        return ResumenAnual(
            anio=anio,
            filas_gastos=filas_gastos,
            filas_ingresos=filas_ingresos,
            totales_gastos=totales_gastos,
            totales_ingresos=totales_ingresos,
        )

    def _nombre_de(self, categoria_id: int, subcategoria_id: int | None) -> str:
        if subcategoria_id is not None:
            subcategoria = self._repositorio_categorias.obtener_subcategoria_por_id(subcategoria_id)
            if subcategoria is not None:
                return subcategoria.nombre
        categoria = self._repositorio_categorias.obtener_categoria_por_id(categoria_id)
        return categoria.nombre if categoria is not None else ""
