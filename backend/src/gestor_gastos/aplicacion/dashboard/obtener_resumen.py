from decimal import Decimal

from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas
from gestor_gastos.dominio.dashboard.valores import ResumenDashboard, SaldoCuenta, TotalCategoria
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class ObtenerResumenDashboard:
    def __init__(
        self,
        repositorio_cuentas: RepositorioCuentas,
        repositorio_categorias: RepositorioCategorias,
        repositorio_movimientos: RepositorioMovimientos,
    ) -> None:
        self._repositorio_cuentas = repositorio_cuentas
        self._repositorio_categorias = repositorio_categorias
        self._repositorio_movimientos = repositorio_movimientos

    def ejecutar(self) -> ResumenDashboard:
        saldos_por_cuenta = [
            SaldoCuenta(
                cuenta_id=cuenta.id,
                numero_cuenta=cuenta.numero_cuenta,
                alias=cuenta.alias,
                saldo=self._repositorio_movimientos.obtener_ultimo_saldo(cuenta.id) or Decimal("0"),
            )
            for cuenta in self._repositorio_cuentas.listar()
        ]
        saldo_global = sum((s.saldo for s in saldos_por_cuenta), Decimal("0"))

        categorias = self._repositorio_categorias.listar_categorias()
        gastos = self._repositorio_movimientos.sumar_gastos_por_categoria()
        ingresos = self._repositorio_movimientos.sumar_ingresos_por_categoria()

        return ResumenDashboard(
            saldo_global=saldo_global,
            saldos_por_cuenta=saldos_por_cuenta,
            gastos_por_categoria=[
                TotalCategoria(categoria_id=c.id, nombre=c.nombre, total=gastos[c.id])
                for c in categorias
                if c.id in gastos
            ],
            ingresos_por_categoria=[
                TotalCategoria(categoria_id=c.id, nombre=c.nombre, total=ingresos[c.id])
                for c in categorias
                if c.id in ingresos
            ],
        )
