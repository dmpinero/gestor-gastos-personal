import datetime
import io
import unicodedata
from decimal import Decimal
from typing import Any

import pandas as pd

from gestor_gastos.dominio.importacion.excepciones import (
    CabeceraNoReconocidaError,
    ExtensionNoSoportadaError,
    FicheroSinMovimientosError,
)
from gestor_gastos.dominio.importacion.valores import (
    CabeceraExcel,
    DatosExcelLeidos,
    FilaMovimientoExcel,
)

_MOTORES_POR_EXTENSION = {".xlsx": "openpyxl", ".xls": "xlrd"}

_FILAS_MAXIMAS_CABECERA = 15

_COLUMNAS_ESPERADAS = {
    "fecha_valor": ("FECHA DE VALOR", "F. VALOR", "F VALOR", "FECHA VALOR"),
    "categoria": ("CATEGORIA",),
    "subcategoria": ("SUBCATEGORIA",),
    "descripcion": ("DESCRIPCION",),
    "comentario": ("COMENTARIO",),
    "importe": ("IMPORTE",),
    "saldo": ("SALDO",),
}


def _normalizar(texto: Any) -> str:
    if texto is None or (isinstance(texto, float) and pd.isna(texto)):
        return ""
    sin_acentos = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode()
    return sin_acentos.strip().upper()


def _es_vacio(valor: Any) -> bool:
    return valor is None or (isinstance(valor, float) and pd.isna(valor))


def _a_fecha(valor: Any) -> datetime.date:
    if isinstance(valor, datetime.datetime):
        return valor.date()
    if isinstance(valor, datetime.date):
        return valor
    return pd.to_datetime(str(valor)).date()


def _a_decimal(valor: Any) -> Decimal:
    return Decimal(str(round(float(valor), 2)))


def _a_texto_o_none(valor: Any) -> str | None:
    if _es_vacio(valor):
        return None
    # Algunos extractos bancarios cuelan espacios dobles entre palabras (p.ej.
    # "SANITAS S A  DE SEGUROS"); se colapsan aquí para que la descripción
    # coincida de forma fiable con las asociaciones por descripción.
    texto = " ".join(str(valor).split())
    return texto or None


class LectorExcelPandas:
    """Adaptador de LectorExcel que lee ficheros .xls/.xlsx con pandas.

    Localiza la fila de cabecera de columnas por nombre (no por posición fija)
    para tolerar pequeños cambios de formato entre exportaciones del banco.
    """

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosExcelLeidos:
        extension = self._extraer_extension(nombre_fichero)
        motor = _MOTORES_POR_EXTENSION.get(extension)
        if motor is None:
            raise ExtensionNoSoportadaError(
                f"Extensión '{extension}' no soportada; solo se admiten .xls y .xlsx"
            )

        tabla = pd.read_excel(io.BytesIO(contenido), sheet_name=0, header=None, engine=motor)

        numero_cuenta = self._buscar_valor_de_cabecera(tabla, "NUMERO DE CUENTA")
        if numero_cuenta is None:
            raise CabeceraNoReconocidaError(
                "No se ha encontrado 'Número de cuenta' en la cabecera del fichero"
            )
        titular = self._buscar_valor_de_cabecera(tabla, "TITULAR")

        indice_columnas, columnas = self._localizar_fila_de_columnas(tabla)

        filas = self._leer_filas(tabla, indice_columnas + 1, columnas)
        if not filas:
            raise FicheroSinMovimientosError("El fichero no contiene ninguna fila de movimientos")

        return DatosExcelLeidos(
            cabecera=CabeceraExcel(numero_cuenta=numero_cuenta, titular=titular),
            filas=filas,
        )

    def _extraer_extension(self, nombre_fichero: str) -> str:
        punto = nombre_fichero.rfind(".")
        return nombre_fichero[punto:].lower() if punto != -1 else ""

    def _buscar_valor_de_cabecera(self, tabla: pd.DataFrame, etiqueta: str) -> str | None:
        limite_filas = min(_FILAS_MAXIMAS_CABECERA, len(tabla))
        for fila in range(limite_filas):
            for columna in range(tabla.shape[1]):
                if etiqueta in _normalizar(tabla.iat[fila, columna]):
                    for siguiente in range(columna + 1, tabla.shape[1]):
                        valor = _a_texto_o_none(tabla.iat[fila, siguiente])
                        if valor is not None:
                            return valor
        return None

    def _localizar_fila_de_columnas(self, tabla: pd.DataFrame) -> tuple[int, dict[str, int]]:
        limite_filas = min(_FILAS_MAXIMAS_CABECERA, len(tabla))
        for fila in range(limite_filas):
            valores_normalizados = [_normalizar(v) for v in tabla.iloc[fila].tolist()]
            columnas = self._emparejar_columnas(valores_normalizados)
            if columnas is not None:
                return fila, columnas
        raise CabeceraNoReconocidaError(
            "No se ha reconocido la fila de cabecera de columnas de movimientos"
        )

    def _emparejar_columnas(self, valores_normalizados: list[str]) -> dict[str, int] | None:
        columnas: dict[str, int] = {}
        for clave, alias in _COLUMNAS_ESPERADAS.items():
            indice = next(
                (i for i, v in enumerate(valores_normalizados) if any(a in v for a in alias)),
                None,
            )
            if indice is not None:
                columnas[clave] = indice

        obligatorias = {"fecha_valor", "categoria", "importe", "saldo", "descripcion"}
        return columnas if obligatorias.issubset(columnas) else None

    def _leer_filas(
        self, tabla: pd.DataFrame, primera_fila_datos: int, columnas: dict[str, int]
    ) -> list[FilaMovimientoExcel]:
        filas: list[FilaMovimientoExcel] = []
        for fila in range(primera_fila_datos, len(tabla)):
            valor_fecha = tabla.iat[fila, columnas["fecha_valor"]]
            if _es_vacio(valor_fecha):
                break

            filas.append(
                FilaMovimientoExcel(
                    fecha_valor=_a_fecha(valor_fecha),
                    categoria=_a_texto_o_none(tabla.iat[fila, columnas["categoria"]]) or "",
                    subcategoria=(
                        _a_texto_o_none(tabla.iat[fila, columnas["subcategoria"]])
                        if "subcategoria" in columnas
                        else None
                    ),
                    descripcion=_a_texto_o_none(tabla.iat[fila, columnas["descripcion"]]) or "",
                    comentario=(
                        _a_texto_o_none(tabla.iat[fila, columnas["comentario"]])
                        if "comentario" in columnas
                        else None
                    ),
                    importe=_a_decimal(tabla.iat[fila, columnas["importe"]]),
                    saldo=_a_decimal(tabla.iat[fila, columnas["saldo"]]),
                )
            )
        return filas
