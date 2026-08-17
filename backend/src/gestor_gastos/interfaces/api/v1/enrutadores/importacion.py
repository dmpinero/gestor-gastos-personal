from dataclasses import asdict

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.orm import Session

from gestor_gastos.aplicacion.importacion.importar_movimientos_excel import (
    ImportarMovimientosExcel,
)
from gestor_gastos.infraestructura.importacion.lector_excel_pandas import LectorExcelPandas
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_cuentas_sqlalchemy import (
    RepositorioCuentasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.interfaces.api.dependencias import obtener_sesion
from gestor_gastos.interfaces.api.respuestas_error import RESPUESTA_CUERPO_MALFORMADO
from gestor_gastos.interfaces.api.v1.esquemas.importacion import ResumenImportacionEsquema

enrutador = APIRouter(prefix="/movimientos", tags=["Movimientos"])


@enrutador.post(
    "/importar", response_model=ResumenImportacionEsquema, responses=RESPUESTA_CUERPO_MALFORMADO
)
async def importar(
    fichero: UploadFile, sesion: Session = Depends(obtener_sesion)
) -> ResumenImportacionEsquema:
    contenido = await fichero.read()
    caso_de_uso = ImportarMovimientosExcel(
        RepositorioCuentasSqlAlchemy(sesion),
        RepositorioCategoriasSqlAlchemy(sesion),
        RepositorioMovimientosSqlAlchemy(sesion),
        LectorExcelPandas(),
    )
    resumen = caso_de_uso.ejecutar(contenido, fichero.filename or "")
    return ResumenImportacionEsquema(**asdict(resumen))
