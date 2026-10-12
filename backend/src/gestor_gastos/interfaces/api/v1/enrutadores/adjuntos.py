from dataclasses import asdict
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.adjunto.contar_adjuntos_por_movimiento import (
    ContarAdjuntosPorMovimiento,
)
from gestor_gastos.aplicacion.adjunto.eliminar_adjunto import EliminarAdjunto
from gestor_gastos.aplicacion.adjunto.listar_adjuntos_de_movimiento import (
    ListarAdjuntosDeMovimiento,
)
from gestor_gastos.aplicacion.adjunto.obtener_adjunto_para_ver import ObtenerAdjuntoParaVer
from gestor_gastos.aplicacion.adjunto.subir_adjunto import SubirAdjunto
from gestor_gastos.configuracion import obtener_configuracion
from gestor_gastos.infraestructura.almacenamiento.almacen_adjuntos_filesystem import (
    AlmacenAdjuntosFilesystem,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_adjuntos_sqlalchemy import (  # noqa: E501
    RepositorioAdjuntosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.interfaces.api.dependencias import obtener_sesion
from gestor_gastos.interfaces.api.respuestas_error import (
    RESPUESTA_CARGA_DEMASIADO_GRANDE,
    RESPUESTA_NO_ENCONTRADO,
)
from gestor_gastos.interfaces.api.v1.esquemas.adjuntos import AdjuntoEsquema, ConteoAdjuntosEsquema

enrutador = APIRouter(prefix="/adjuntos", tags=["Adjuntos"])


def _almacen() -> AlmacenAdjuntosFilesystem:
    return AlmacenAdjuntosFilesystem(Path(obtener_configuracion().ruta_adjuntos))


@enrutador.post(
    "/movimiento/{movimiento_id:int}",
    response_model=AdjuntoEsquema,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CARGA_DEMASIADO_GRANDE},
)
async def subir(
    movimiento_id: int, fichero: UploadFile, sesion: Session = Depends(obtener_sesion)
) -> AdjuntoEsquema:
    contenido = await fichero.read()
    adjunto = SubirAdjunto(
        RepositorioMovimientosSqlAlchemy(sesion),
        RepositorioAdjuntosSqlAlchemy(sesion),
        _almacen(),
    ).ejecutar(movimiento_id, fichero.filename or "adjunto", fichero.content_type, contenido)
    return AdjuntoEsquema(**asdict(adjunto))


@enrutador.get(
    "/movimiento/{movimiento_id:int}",
    response_model=list[AdjuntoEsquema],
    responses=RESPUESTA_NO_ENCONTRADO,
)
def listar_de_movimiento(
    movimiento_id: int, sesion: Session = Depends(obtener_sesion)
) -> list[AdjuntoEsquema]:
    adjuntos = ListarAdjuntosDeMovimiento(RepositorioAdjuntosSqlAlchemy(sesion)).ejecutar(
        movimiento_id
    )
    return [AdjuntoEsquema(**asdict(a)) for a in adjuntos]


@enrutador.get("/conteos", response_model=list[ConteoAdjuntosEsquema])
def conteos(sesion: Session = Depends(obtener_sesion)) -> list[ConteoAdjuntosEsquema]:
    conteos_por_movimiento = ContarAdjuntosPorMovimiento(
        RepositorioAdjuntosSqlAlchemy(sesion)
    ).ejecutar()
    return [
        ConteoAdjuntosEsquema(movimiento_id=movimiento_id, cantidad=cantidad)
        for movimiento_id, cantidad in conteos_por_movimiento.items()
    ]


@enrutador.get("/{id_adjunto:int}/ver", responses=RESPUESTA_NO_ENCONTRADO)
def ver(id_adjunto: int, sesion: Session = Depends(obtener_sesion)) -> Response:
    adjunto, contenido = ObtenerAdjuntoParaVer(
        RepositorioAdjuntosSqlAlchemy(sesion), _almacen()
    ).ejecutar(id_adjunto)
    return Response(
        content=contenido,
        media_type=adjunto.tipo_mime or "application/octet-stream",
        headers={"Content-Disposition": f'inline; filename="{adjunto.nombre_original}"'},
    )


@enrutador.delete("/{id_adjunto:int}", status_code=204, responses=RESPUESTA_NO_ENCONTRADO)
def eliminar(id_adjunto: int, sesion: Session = Depends(obtener_sesion)) -> None:
    EliminarAdjunto(RepositorioAdjuntosSqlAlchemy(sesion), _almacen()).ejecutar(id_adjunto)
