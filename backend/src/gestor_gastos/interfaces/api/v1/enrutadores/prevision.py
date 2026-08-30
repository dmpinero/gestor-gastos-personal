from dataclasses import asdict

from fastapi import APIRouter, Depends, Path, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.prevision.actualizar_concepto_previsto import (
    ActualizarConceptoPrevisto,
)
from gestor_gastos.aplicacion.prevision.ajustar_valor_mensual import AjustarValorMensual
from gestor_gastos.aplicacion.prevision.cargar_acumulado_real import CargarAcumuladoReal
from gestor_gastos.aplicacion.prevision.crear_asociacion import CrearAsociacion
from gestor_gastos.aplicacion.prevision.crear_asociacion_descripcion import (
    CrearAsociacionDescripcion,
)
from gestor_gastos.aplicacion.prevision.crear_concepto_previsto import CrearConceptoPrevisto
from gestor_gastos.aplicacion.prevision.eliminar_ajuste_mensual import EliminarAjusteMensual
from gestor_gastos.aplicacion.prevision.eliminar_asociacion import EliminarAsociacion
from gestor_gastos.aplicacion.prevision.eliminar_asociacion_descripcion import (
    EliminarAsociacionDescripcion,
)
from gestor_gastos.aplicacion.prevision.eliminar_concepto_previsto import (
    EliminarConceptoPrevisto,
)
from gestor_gastos.aplicacion.prevision.exportar_resumen_anual_excel import (
    ExportarResumenAnualExcel,
)
from gestor_gastos.aplicacion.prevision.importar_conceptos_previstos_excel import (
    ImportarConceptosPrevistosExcel,
)
from gestor_gastos.aplicacion.prevision.importar_resumen_anual_excel import (
    ImportarResumenAnualExcel,
)
from gestor_gastos.aplicacion.prevision.listar_asociaciones import ListarAsociaciones
from gestor_gastos.aplicacion.prevision.listar_asociaciones_descripcion import (
    ListarAsociacionesDescripcion,
)
from gestor_gastos.aplicacion.prevision.listar_conceptos_previstos import (
    ListarConceptosPrevistos,
)
from gestor_gastos.aplicacion.prevision.listar_movimientos_de_concepto import (
    ListarMovimientosDeConcepto,
)
from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_ajustes_prevision_sqlalchemy import (  # noqa: E501
    RepositorioAjustesPrevisionSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_asociaciones_descripcion_sqlalchemy import (  # noqa: E501
    RepositorioAsociacionesDescripcionSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_asociaciones_sqlalchemy import (  # noqa: E501
    RepositorioAsociacionesSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)
from gestor_gastos.infraestructura.prevision.escritor_excel_resumen_anual_openpyxl import (
    EscritorExcelResumenAnualOpenpyxl,
)
from gestor_gastos.infraestructura.prevision.lector_excel_conceptos_previstos_openpyxl import (
    LectorExcelConceptosPrevistosOpenpyxl,
)
from gestor_gastos.infraestructura.prevision.lector_excel_resumen_anual_openpyxl import (
    LectorExcelResumenAnualOpenpyxl,
)
from gestor_gastos.interfaces.api.dependencias import obtener_sesion
from gestor_gastos.interfaces.api.respuestas_error import (
    RESPUESTA_CONFLICTO,
    RESPUESTA_CUERPO_MALFORMADO,
    RESPUESTA_FILTRO_INVALIDO,
    RESPUESTA_NO_ENCONTRADO,
)
from gestor_gastos.interfaces.api.v1.esquemas.movimiento import MovimientoSalidaEsquema
from gestor_gastos.interfaces.api.v1.esquemas.prevision import (
    AjusteMensualEsquema,
    AsociacionConceptoCrearEsquema,
    AsociacionConceptoSalidaEsquema,
    AsociacionDescripcionCrearEsquema,
    AsociacionDescripcionSalidaEsquema,
    CargaAcumuladoRealEsquema,
    ConceptoPrevistoActualizarEsquema,
    ConceptoPrevistoCrearEsquema,
    ConceptoPrevistoSalidaEsquema,
    ResumenAnualEsquema,
    ResumenImportacionConceptosPrevistosEsquema,
    ResumenImportacionResumenAnualEsquema,
)

enrutador = APIRouter(prefix="/previsiones", tags=["Previsiones"])


def _construir_obtener_resumen_anual(sesion: Session) -> ObtenerResumenAnual:
    return ObtenerResumenAnual(
        RepositorioPrevisionesSqlAlchemy(sesion),
        RepositorioCategoriasSqlAlchemy(sesion),
        RepositorioMovimientosSqlAlchemy(sesion),
        RepositorioAjustesPrevisionSqlAlchemy(sesion),
        RepositorioAsociacionesSqlAlchemy(sesion),
        RepositorioAsociacionesDescripcionSqlAlchemy(sesion),
    )


@enrutador.get("", response_model=list[ConceptoPrevistoSalidaEsquema])
def listar(sesion: Session = Depends(obtener_sesion)) -> list[ConceptoPrevistoSalidaEsquema]:
    conceptos = ListarConceptosPrevistos(RepositorioPrevisionesSqlAlchemy(sesion)).ejecutar()
    return [ConceptoPrevistoSalidaEsquema(**asdict(c)) for c in conceptos]


@enrutador.post(
    "",
    response_model=ConceptoPrevistoSalidaEsquema,
    status_code=status.HTTP_201_CREATED,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CUERPO_MALFORMADO},
)
def crear(
    datos: ConceptoPrevistoCrearEsquema, sesion: Session = Depends(obtener_sesion)
) -> ConceptoPrevistoSalidaEsquema:
    concepto = CrearConceptoPrevisto(
        RepositorioPrevisionesSqlAlchemy(sesion), RepositorioCategoriasSqlAlchemy(sesion)
    ).ejecutar(
        categoria_id=datos.categoria_id,
        subcategoria_id=datos.subcategoria_id,
        periodicidad=datos.periodicidad,
        importe_previsto=datos.importe_previsto,
        mes_inicio=datos.mes_inicio,
    )
    return ConceptoPrevistoSalidaEsquema(**asdict(concepto))


@enrutador.put(
    "/{id_concepto:int}",
    response_model=ConceptoPrevistoSalidaEsquema,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CUERPO_MALFORMADO},
)
def actualizar(
    id_concepto: int,
    datos: ConceptoPrevistoActualizarEsquema,
    sesion: Session = Depends(obtener_sesion),
) -> ConceptoPrevistoSalidaEsquema:
    concepto = ActualizarConceptoPrevisto(
        RepositorioPrevisionesSqlAlchemy(sesion), RepositorioCategoriasSqlAlchemy(sesion)
    ).ejecutar(
        id_concepto,
        categoria_id=datos.categoria_id,
        subcategoria_id=datos.subcategoria_id,
        periodicidad=datos.periodicidad,
        importe_previsto=datos.importe_previsto,
        mes_inicio=datos.mes_inicio,
    )
    return ConceptoPrevistoSalidaEsquema(**asdict(concepto))


@enrutador.delete(
    "/{id_concepto:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=RESPUESTA_NO_ENCONTRADO,
)
def eliminar(id_concepto: int, sesion: Session = Depends(obtener_sesion)) -> None:
    EliminarConceptoPrevisto(RepositorioPrevisionesSqlAlchemy(sesion)).ejecutar(id_concepto)


@enrutador.get("/resumen-anual", response_model=ResumenAnualEsquema)
def resumen_anual(
    anio: int = Query(ge=1, le=9999), sesion: Session = Depends(obtener_sesion)
) -> ResumenAnualEsquema:
    resumen = _construir_obtener_resumen_anual(sesion).ejecutar(anio)
    return ResumenAnualEsquema(**asdict(resumen))


@enrutador.get(
    "/resumen-anual/exportar",
    responses={
        200: {
            "content": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}},
            "description": "Excel del resumen anual",
        },
        **RESPUESTA_FILTRO_INVALIDO,
    },
)
def exportar_resumen_anual(
    anio_desde: int = Query(ge=1, le=9999),
    anio_hasta: int = Query(ge=1, le=9999),
    sesion: Session = Depends(obtener_sesion),
) -> Response:
    contenido = ExportarResumenAnualExcel(
        _construir_obtener_resumen_anual(sesion), EscritorExcelResumenAnualOpenpyxl()
    ).ejecutar(anio_desde, anio_hasta)
    nombre_fichero = (
        f"resumen-anual-{anio_desde}.xlsx"
        if anio_desde == anio_hasta
        else f"resumen-anual-{anio_desde}-{anio_hasta}.xlsx"
    )
    return Response(
        content=contenido,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{nombre_fichero}"'},
    )


@enrutador.post(
    "/resumen-anual/importar",
    response_model=ResumenImportacionResumenAnualEsquema,
    responses=RESPUESTA_CUERPO_MALFORMADO,
)
async def importar_resumen_anual(
    fichero: UploadFile,
    sesion: Session = Depends(obtener_sesion),
) -> ResumenImportacionResumenAnualEsquema:
    contenido = await fichero.read()
    resumen = ImportarResumenAnualExcel(
        LectorExcelResumenAnualOpenpyxl(),
        _construir_obtener_resumen_anual(sesion),
        AjustarValorMensual(
            RepositorioPrevisionesSqlAlchemy(sesion), RepositorioAjustesPrevisionSqlAlchemy(sesion)
        ),
        EliminarAjusteMensual(
            RepositorioPrevisionesSqlAlchemy(sesion), RepositorioAjustesPrevisionSqlAlchemy(sesion)
        ),
    ).ejecutar(contenido, fichero.filename or "")
    return ResumenImportacionResumenAnualEsquema(**asdict(resumen))


@enrutador.post(
    "/importar",
    response_model=ResumenImportacionConceptosPrevistosEsquema,
    responses=RESPUESTA_CUERPO_MALFORMADO,
)
async def importar_conceptos_previstos(
    fichero: UploadFile, sesion: Session = Depends(obtener_sesion)
) -> ResumenImportacionConceptosPrevistosEsquema:
    contenido = await fichero.read()
    resumen = ImportarConceptosPrevistosExcel(
        RepositorioCategoriasSqlAlchemy(sesion),
        RepositorioPrevisionesSqlAlchemy(sesion),
        LectorExcelConceptosPrevistosOpenpyxl(),
    ).ejecutar(contenido, fichero.filename or "")
    return ResumenImportacionConceptosPrevistosEsquema(**asdict(resumen))


@enrutador.put(
    "/{id_concepto:int}/ajustes/{anio:int}/{mes:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CUERPO_MALFORMADO},
)
def ajustar_valor_mensual(
    id_concepto: int,
    datos: AjusteMensualEsquema,
    anio: int = Path(ge=1, le=9999),
    mes: int = Path(ge=1, le=12),
    sesion: Session = Depends(obtener_sesion),
) -> None:
    AjustarValorMensual(
        RepositorioPrevisionesSqlAlchemy(sesion), RepositorioAjustesPrevisionSqlAlchemy(sesion)
    ).ejecutar(id_concepto, anio, mes, datos.importe)


@enrutador.delete(
    "/{id_concepto:int}/ajustes/{anio:int}/{mes:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=RESPUESTA_NO_ENCONTRADO,
)
def eliminar_ajuste_mensual(
    id_concepto: int,
    anio: int = Path(ge=1, le=9999),
    mes: int = Path(ge=1, le=12),
    sesion: Session = Depends(obtener_sesion),
) -> None:
    EliminarAjusteMensual(
        RepositorioPrevisionesSqlAlchemy(sesion), RepositorioAjustesPrevisionSqlAlchemy(sesion)
    ).ejecutar(id_concepto, anio, mes)


@enrutador.post(
    "/{id_concepto:int}/cargar-real/{anio:int}",
    response_model=CargaAcumuladoRealEsquema,
    responses=RESPUESTA_NO_ENCONTRADO,
)
def cargar_acumulado_real(
    id_concepto: int,
    anio: int = Path(ge=1, le=9999),
    sesion: Session = Depends(obtener_sesion),
) -> CargaAcumuladoRealEsquema:
    meses_actualizados = CargarAcumuladoReal(
        RepositorioPrevisionesSqlAlchemy(sesion),
        RepositorioMovimientosSqlAlchemy(sesion),
        RepositorioAjustesPrevisionSqlAlchemy(sesion),
        RepositorioAsociacionesSqlAlchemy(sesion),
        RepositorioAsociacionesDescripcionSqlAlchemy(sesion),
    ).ejecutar(id_concepto, anio)
    return CargaAcumuladoRealEsquema(meses_actualizados=meses_actualizados)


@enrutador.get(
    "/{id_concepto:int}/movimientos",
    response_model=list[MovimientoSalidaEsquema],
    responses=RESPUESTA_NO_ENCONTRADO,
)
def movimientos_de_concepto(
    id_concepto: int,
    anio: int = Query(ge=1, le=9999),
    mes: int = Query(ge=1, le=12),
    sesion: Session = Depends(obtener_sesion),
) -> list[MovimientoSalidaEsquema]:
    movimientos = ListarMovimientosDeConcepto(
        RepositorioPrevisionesSqlAlchemy(sesion),
        RepositorioMovimientosSqlAlchemy(sesion),
        RepositorioAsociacionesSqlAlchemy(sesion),
        RepositorioAsociacionesDescripcionSqlAlchemy(sesion),
    ).ejecutar(id_concepto, anio, mes)
    return [MovimientoSalidaEsquema(**asdict(m)) for m in movimientos]


@enrutador.get("/asociaciones", response_model=list[AsociacionConceptoSalidaEsquema])
def listar_asociaciones(
    sesion: Session = Depends(obtener_sesion),
) -> list[AsociacionConceptoSalidaEsquema]:
    asociaciones = ListarAsociaciones(RepositorioAsociacionesSqlAlchemy(sesion)).ejecutar()
    return [AsociacionConceptoSalidaEsquema(**asdict(a)) for a in asociaciones]


@enrutador.post(
    "/asociaciones",
    response_model=AsociacionConceptoSalidaEsquema,
    status_code=status.HTTP_201_CREATED,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CONFLICTO, **RESPUESTA_CUERPO_MALFORMADO},
)
def crear_asociacion(
    datos: AsociacionConceptoCrearEsquema, sesion: Session = Depends(obtener_sesion)
) -> AsociacionConceptoSalidaEsquema:
    asociacion = CrearAsociacion(
        RepositorioAsociacionesSqlAlchemy(sesion), RepositorioCategoriasSqlAlchemy(sesion)
    ).ejecutar(
        categoria_resumen_id=datos.categoria_resumen_id,
        subcategoria_resumen_id=datos.subcategoria_resumen_id,
        categoria_movimiento_id=datos.categoria_movimiento_id,
        subcategoria_movimiento_id=datos.subcategoria_movimiento_id,
    )
    return AsociacionConceptoSalidaEsquema(**asdict(asociacion))


@enrutador.delete(
    "/asociaciones/{id_asociacion:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=RESPUESTA_NO_ENCONTRADO,
)
def eliminar_asociacion(id_asociacion: int, sesion: Session = Depends(obtener_sesion)) -> None:
    EliminarAsociacion(RepositorioAsociacionesSqlAlchemy(sesion)).ejecutar(id_asociacion)


@enrutador.get("/asociaciones-descripcion", response_model=list[AsociacionDescripcionSalidaEsquema])
def listar_asociaciones_descripcion(
    sesion: Session = Depends(obtener_sesion),
) -> list[AsociacionDescripcionSalidaEsquema]:
    asociaciones = ListarAsociacionesDescripcion(
        RepositorioAsociacionesDescripcionSqlAlchemy(sesion)
    ).ejecutar()
    return [AsociacionDescripcionSalidaEsquema(**asdict(a)) for a in asociaciones]


@enrutador.post(
    "/asociaciones-descripcion",
    response_model=AsociacionDescripcionSalidaEsquema,
    status_code=status.HTTP_201_CREATED,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CONFLICTO, **RESPUESTA_CUERPO_MALFORMADO},
)
def crear_asociacion_descripcion(
    datos: AsociacionDescripcionCrearEsquema, sesion: Session = Depends(obtener_sesion)
) -> AsociacionDescripcionSalidaEsquema:
    asociacion = CrearAsociacionDescripcion(
        RepositorioAsociacionesDescripcionSqlAlchemy(sesion),
        RepositorioCategoriasSqlAlchemy(sesion),
    ).ejecutar(
        categoria_resumen_id=datos.categoria_resumen_id,
        subcategoria_resumen_id=datos.subcategoria_resumen_id,
        descripcion=datos.descripcion,
    )
    return AsociacionDescripcionSalidaEsquema(**asdict(asociacion))


@enrutador.delete(
    "/asociaciones-descripcion/{id_asociacion:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=RESPUESTA_NO_ENCONTRADO,
)
def eliminar_asociacion_descripcion(
    id_asociacion: int, sesion: Session = Depends(obtener_sesion)
) -> None:
    EliminarAsociacionDescripcion(RepositorioAsociacionesDescripcionSqlAlchemy(sesion)).ejecutar(
        id_asociacion
    )
