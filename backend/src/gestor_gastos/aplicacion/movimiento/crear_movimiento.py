import datetime
from decimal import Decimal

from gestor_gastos.aplicacion.movimiento.validaciones import validar_referencias
from gestor_gastos.dominio.categoria.repositorio import RepositorioCategorias
from gestor_gastos.dominio.cuenta.repositorio import RepositorioCuentas
from gestor_gastos.dominio.movimiento.entidades import Movimiento
from gestor_gastos.dominio.movimiento.repositorio import RepositorioMovimientos


class CrearMovimiento:
    def __init__(
        self,
        repositorio: RepositorioMovimientos,
        repositorio_cuentas: RepositorioCuentas,
        repositorio_categorias: RepositorioCategorias,
    ) -> None:
        self._repositorio = repositorio
        self._repositorio_cuentas = repositorio_cuentas
        self._repositorio_categorias = repositorio_categorias

    def ejecutar(
        self,
        cuenta_id: int,
        categoria_id: int,
        fecha_valor: datetime.date,
        descripcion: str,
        importe: Decimal,
        saldo: Decimal,
        subcategoria_id: int | None = None,
        comentario: str | None = None,
    ) -> Movimiento:
        validar_referencias(
            self._repositorio_cuentas,
            self._repositorio_categorias,
            cuenta_id,
            categoria_id,
            subcategoria_id,
        )

        movimiento = Movimiento(
            cuenta_id=cuenta_id,
            categoria_id=categoria_id,
            subcategoria_id=subcategoria_id,
            fecha_valor=fecha_valor,
            descripcion=descripcion,
            comentario=comentario,
            importe=importe,
            saldo=saldo,
        )
        return self._repositorio.crear(movimiento)
