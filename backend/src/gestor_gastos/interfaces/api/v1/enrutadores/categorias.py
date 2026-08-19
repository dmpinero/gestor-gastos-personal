from dataclasses import asdict

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.categoria.actualizar_categoria import ActualizarCategoria
from gestor_gastos.aplicacion.categoria.actualizar_subcategoria import ActualizarSubcategoria
from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.categoria.crear_subcategoria import CrearSubcategoria
from gestor_gastos.aplicacion.categoria.eliminar_categoria import EliminarCategoria
from gestor_gastos.aplicacion.categoria.eliminar_subcategoria import EliminarSubcategoria
from gestor_gastos.aplicacion.categoria.listar_categorias import ListarCategorias
from gestor_gastos.aplicacion.categoria.obtener_dependencias_categoria import (
    ObtenerDependenciasCategoria,
)
from gestor_gastos.aplicacion.categoria.obtener_dependencias_subcategoria import (
    ObtenerDependenciasSubcategoria,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.interfaces.api.dependencias import obtener_sesion
from gestor_gastos.interfaces.api.respuestas_error import (
    RESPUESTA_CONFLICTO,
    RESPUESTA_CUERPO_MALFORMADO,
    RESPUESTA_NO_ENCONTRADO,
)
from gestor_gastos.interfaces.api.v1.esquemas.categoria import (
    CategoriaActualizarEsquema,
    CategoriaConSubcategoriasSalidaEsquema,
    CategoriaCrearEsquema,
    CategoriaSalidaEsquema,
    DependenciasCategoriaEsquema,
    DependenciasSubcategoriaEsquema,
    SubcategoriaActualizarEsquema,
    SubcategoriaCrearEsquema,
    SubcategoriaSalidaEsquema,
)

enrutador = APIRouter(prefix="/categorias", tags=["Categorías"])


@enrutador.get("", response_model=list[CategoriaConSubcategoriasSalidaEsquema])
def listar(
    sesion: Session = Depends(obtener_sesion),
) -> list[CategoriaConSubcategoriasSalidaEsquema]:
    resultado = ListarCategorias(RepositorioCategoriasSqlAlchemy(sesion)).ejecutar()
    return [
        CategoriaConSubcategoriasSalidaEsquema(
            categoria=CategoriaSalidaEsquema(**asdict(item.categoria)),
            subcategorias=[SubcategoriaSalidaEsquema(**asdict(s)) for s in item.subcategorias],
        )
        for item in resultado
    ]


@enrutador.post(
    "",
    response_model=CategoriaSalidaEsquema,
    status_code=status.HTTP_201_CREATED,
    responses={**RESPUESTA_CONFLICTO, **RESPUESTA_CUERPO_MALFORMADO},
)
def crear(
    datos: CategoriaCrearEsquema, sesion: Session = Depends(obtener_sesion)
) -> CategoriaSalidaEsquema:
    categoria = CrearCategoria(RepositorioCategoriasSqlAlchemy(sesion)).ejecutar(datos.nombre)
    return CategoriaSalidaEsquema(**asdict(categoria))


@enrutador.put(
    "/{id_categoria:int}",
    response_model=CategoriaSalidaEsquema,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CONFLICTO, **RESPUESTA_CUERPO_MALFORMADO},
)
def actualizar(
    id_categoria: int,
    datos: CategoriaActualizarEsquema,
    sesion: Session = Depends(obtener_sesion),
) -> CategoriaSalidaEsquema:
    categoria = ActualizarCategoria(RepositorioCategoriasSqlAlchemy(sesion)).ejecutar(
        id_categoria, datos.nombre
    )
    return CategoriaSalidaEsquema(**asdict(categoria))


@enrutador.delete(
    "/{id_categoria:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CONFLICTO},
)
def eliminar(
    id_categoria: int, cascada: bool = Query(False), sesion: Session = Depends(obtener_sesion)
) -> None:
    EliminarCategoria(
        RepositorioCategoriasSqlAlchemy(sesion), RepositorioMovimientosSqlAlchemy(sesion)
    ).ejecutar(id_categoria, cascada=cascada)


@enrutador.get(
    "/{id_categoria:int}/dependencias",
    response_model=DependenciasCategoriaEsquema,
    responses=RESPUESTA_NO_ENCONTRADO,
)
def obtener_dependencias(
    id_categoria: int, sesion: Session = Depends(obtener_sesion)
) -> DependenciasCategoriaEsquema:
    dependencias = ObtenerDependenciasCategoria(
        RepositorioCategoriasSqlAlchemy(sesion), RepositorioMovimientosSqlAlchemy(sesion)
    ).ejecutar(id_categoria)
    return DependenciasCategoriaEsquema(**asdict(dependencias))


@enrutador.post(
    "/{id_categoria:int}/subcategorias",
    response_model=SubcategoriaSalidaEsquema,
    status_code=status.HTTP_201_CREATED,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CONFLICTO, **RESPUESTA_CUERPO_MALFORMADO},
)
def crear_subcategoria(
    id_categoria: int, datos: SubcategoriaCrearEsquema, sesion: Session = Depends(obtener_sesion)
) -> SubcategoriaSalidaEsquema:
    subcategoria = CrearSubcategoria(RepositorioCategoriasSqlAlchemy(sesion)).ejecutar(
        id_categoria, datos.nombre
    )
    return SubcategoriaSalidaEsquema(**asdict(subcategoria))


@enrutador.put(
    "/{id_categoria:int}/subcategorias/{id_subcategoria:int}",
    response_model=SubcategoriaSalidaEsquema,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CONFLICTO, **RESPUESTA_CUERPO_MALFORMADO},
)
def actualizar_subcategoria(
    id_categoria: int,
    id_subcategoria: int,
    datos: SubcategoriaActualizarEsquema,
    sesion: Session = Depends(obtener_sesion),
) -> SubcategoriaSalidaEsquema:
    subcategoria = ActualizarSubcategoria(RepositorioCategoriasSqlAlchemy(sesion)).ejecutar(
        id_subcategoria, datos.nombre
    )
    return SubcategoriaSalidaEsquema(**asdict(subcategoria))


@enrutador.delete(
    "/{id_categoria:int}/subcategorias/{id_subcategoria:int}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**RESPUESTA_NO_ENCONTRADO, **RESPUESTA_CONFLICTO},
)
def eliminar_subcategoria(
    id_categoria: int,
    id_subcategoria: int,
    cascada: bool = Query(False),
    sesion: Session = Depends(obtener_sesion),
) -> None:
    EliminarSubcategoria(
        RepositorioCategoriasSqlAlchemy(sesion), RepositorioMovimientosSqlAlchemy(sesion)
    ).ejecutar(id_subcategoria, cascada=cascada)


@enrutador.get(
    "/{id_categoria:int}/subcategorias/{id_subcategoria:int}/dependencias",
    response_model=DependenciasSubcategoriaEsquema,
    responses=RESPUESTA_NO_ENCONTRADO,
)
def obtener_dependencias_subcategoria(
    id_categoria: int, id_subcategoria: int, sesion: Session = Depends(obtener_sesion)
) -> DependenciasSubcategoriaEsquema:
    dependencias = ObtenerDependenciasSubcategoria(
        RepositorioCategoriasSqlAlchemy(sesion), RepositorioMovimientosSqlAlchemy(sesion)
    ).ejecutar(id_subcategoria)
    return DependenciasSubcategoriaEsquema(**asdict(dependencias))
