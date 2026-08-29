from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from gestor_gastos.dominio.exportacion.excepciones import RestauracionDeDatosFallidaError
from gestor_gastos.dominio.exportacion.valores import DatosCompletos
from gestor_gastos.infraestructura.persistencia.modelos import (
    AjustePrevisionMensualModelo,
    AsociacionConceptoModelo,
    CategoriaModelo,
    ConceptoPrevistoModelo,
    CuentaBancariaModelo,
    MovimientoModelo,
    SubcategoriaModelo,
)


class RepositorioImportacionCompletaSqlAlchemy:
    def __init__(self, sesion: Session) -> None:
        self._sesion = sesion

    def reemplazar_todo(self, datos: DatosCompletos) -> None:
        try:
            # Se descarta cualquier objeto ya cargado en el mapa de identidad
            # de la sesión: vamos a borrar y reinsertar las mismas filas (con
            # los mismos ids), y sin esto SQLAlchemy podría confundir una
            # instancia nueva con una ya conocida para esa misma clave.
            self._sesion.expunge_all()
            self._borrar_todo()
            self._insertar_todo(datos)
            self._sesion.commit()
        except IntegrityError as error:
            self._sesion.rollback()
            raise RestauracionDeDatosFallidaError(
                "Los datos del Excel no son consistentes entre sí (p. ej. una fila hace "
                "referencia a un id que no existe en otra hoja); no se ha modificado nada."
            ) from error
        except Exception:
            self._sesion.rollback()
            raise

    def _borrar_todo(self) -> None:
        self._sesion.execute(delete(AsociacionConceptoModelo))
        self._sesion.execute(delete(MovimientoModelo))
        self._sesion.execute(delete(AjustePrevisionMensualModelo))
        self._sesion.execute(delete(ConceptoPrevistoModelo))
        self._sesion.execute(delete(SubcategoriaModelo))
        self._sesion.execute(delete(CategoriaModelo))
        self._sesion.execute(delete(CuentaBancariaModelo))

    def _insertar_todo(self, datos: DatosCompletos) -> None:
        self._sesion.add_all(
            CuentaBancariaModelo(
                id=cuenta.id,
                numero_cuenta=cuenta.numero_cuenta,
                alias=cuenta.alias,
                entidad_bancaria=cuenta.entidad_bancaria,
                moneda=cuenta.moneda,
                titular=cuenta.titular,
            )
            for cuenta in datos.cuentas
        )
        self._sesion.add_all(
            CategoriaModelo(id=categoria.id, nombre=categoria.nombre)
            for categoria in datos.categorias
        )
        self._sesion.flush()

        self._sesion.add_all(
            SubcategoriaModelo(
                id=subcategoria.id,
                categoria_id=subcategoria.categoria_id,
                nombre=subcategoria.nombre,
            )
            for subcategoria in datos.subcategorias
        )
        self._sesion.flush()

        self._sesion.add_all(
            AsociacionConceptoModelo(
                id=asociacion.id,
                categoria_resumen_id=asociacion.categoria_resumen_id,
                subcategoria_resumen_id=asociacion.subcategoria_resumen_id,
                categoria_movimiento_id=asociacion.categoria_movimiento_id,
                subcategoria_movimiento_id=asociacion.subcategoria_movimiento_id,
            )
            for asociacion in datos.asociaciones
        )

        self._sesion.add_all(
            MovimientoModelo(
                id=movimiento.id,
                cuenta_id=movimiento.cuenta_id,
                categoria_id=movimiento.categoria_id,
                subcategoria_id=movimiento.subcategoria_id,
                fecha_valor=movimiento.fecha_valor,
                descripcion=movimiento.descripcion,
                comentario=movimiento.comentario,
                importe=movimiento.importe,
                saldo=movimiento.saldo,
            )
            for movimiento in datos.movimientos
        )
        self._sesion.add_all(
            ConceptoPrevistoModelo(
                id=concepto.id,
                categoria_id=concepto.categoria_id,
                subcategoria_id=concepto.subcategoria_id,
                periodicidad=concepto.periodicidad,
                mes_inicio=concepto.mes_inicio,
                importe_previsto=concepto.importe_previsto,
            )
            for concepto in datos.conceptos_previstos
        )
        self._sesion.flush()

        self._sesion.add_all(
            AjustePrevisionMensualModelo(
                id=ajuste.id,
                concepto_id=ajuste.concepto_id,
                anio=ajuste.anio,
                mes=ajuste.mes,
                importe=ajuste.importe,
            )
            for ajuste in datos.ajustes
        )
        self._sesion.flush()
