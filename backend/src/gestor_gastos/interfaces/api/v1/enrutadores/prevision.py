from dataclasses import asdict

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.prevision.actualizar_concepto_previsto import (
    ActualizarConceptoPrevisto,
)
from gestor_gastos.aplicacion.prevision.ajustar_valor_mensual import AjustarValorMensual
from gestor_gastos.aplicacion.prevision.crear_concepto_previsto import CrearConceptoPrevisto
from gestor_gastos.aplicacion.prevision.eliminar_ajuste_mensual import EliminarAjusteMensual
from gestor_gastos.aplicacion.prevision.eliminar_concepto_previsto import (
    EliminarConceptoPrevisto,
)
from gestor_gastos.aplicacion.prevision.listar_conceptos_previstos import (
    ListarConceptosPrevistos,
)
from gestor_gastos.aplicacion.prevision.obtener_resumen_anual import ObtenerResumenAnual
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_ajustes_prevision_sqlalchemy import (  # noqa: E501
    RepositorioAjustesPrevisionSqlAlchemy,
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
from gestor_gastos.interfaces.api.dependencias import obtener_sesion
from gestor_gastos.interfaces.api.respuestas_error import (
    RESPUESTA_CUERPO_MALFORMADO,
    RESPUESTA_NO_ENCONTRADO,
)
from gestor_gastos.interfaces.api.v1.esquemas.prevision import (
    AjusteMensualEsquema,
    ConceptoPrevistoActualizarEsquema,
    ConceptoPrevistoCrearEsquema,
    ConceptoPrevistoSalidaEsquema,
    ResumenAnualEsquema,
)

enrutador = APIRouter(prefix="/previsiones", tags=["Previsiones"])


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
    anio: int = Query(...), sesion: Session = Depends(obtener_sesion)
) -> ResumenAnualEsquema:
    resumen = ObtenerResumenAnual(
        RepositorioPrevisionesSqlAlchemy(sesion),
        RepositorioCategoriasSqlAlchemy(sesion),
        RepositorioMovimientosSqlAlchemy(sesion),
        RepositorioAjustesPrevisionSqlAlchemy(sesion),
    ).ejecutar(anio)
    return ResumenAnualEsquema(**asdict(resumen))


@enrutador.put(
    "/{id_concepto:int}/ajustes/{anio:int}/{mes:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CUERPO_MALFORMADO},
)
def ajustar_valor_mensual(
    id_concepto: int,
    anio: int,
    datos: AjusteMensualEsquema,
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
    anio: int,
    mes: int = Path(ge=1, le=12),
    sesion: Session = Depends(obtener_sesion),
) -> None:
    EliminarAjusteMensual(
        RepositorioPrevisionesSqlAlchemy(sesion), RepositorioAjustesPrevisionSqlAlchemy(sesion)
    ).ejecutar(id_concepto, anio, mes)
