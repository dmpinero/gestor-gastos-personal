import datetime
import io
import re
from decimal import Decimal

import pdfplumber

from gestor_gastos.dominio.importacion.excepciones import (
    CabeceraNoReconocidaError,
    ExtensionNoSoportadaError,
    FicheroSinMovimientosError,
)
from gestor_gastos.dominio.importacion.valores import (
    CabeceraExcel,
    DatosPdfLeidos,
    FilaMovimientoPdf,
)

# "Entidad Oficina DC Nº Cuenta" en una sola línea, p.ej. "1465 0100 96 1705727894".
_PATRON_NUMERO_CUENTA = re.compile(r"^\d{4} \d{4} \d{2} \d{10}$")
# "NOELIA SILVA LOPEZ TITULAR 75560259S": nombre, la palabra TITULAR y el NIF/NIE/CIF.
_PATRON_TITULAR = re.compile(r"^(.+?)\s+TITULAR\s+\S+$")
# Cada movimiento ocupa una única línea de texto extraído (pdfplumber ya
# reconstruye la fila de la tabla): "Fecha operación Fecha Valor Concepto
# Importe Saldo", p.ej. "02-09-2026 02-09-2026 Pago NATURA GRAN PLAZA 2
# -20,80 € 2.690,32 €". Se usa la Fecha Valor (segunda fecha), no la de
# operación, para ser consistente con el importador de Excel.
_PATRON_MOVIMIENTO = re.compile(
    r"^\d{2}-\d{2}-\d{4}\s+(\d{2})-(\d{2})-(\d{4})\s+(.+?)\s+"
    r"(-?[\d.]+,\d{2})\s*[^\d\s-]*\s+(-?[\d.]+,\d{2})\s*[^\d\s-]*$"
)


def _a_decimal(texto: str) -> Decimal:
    return Decimal(texto.replace(".", "").replace(",", "."))


class LectorPdfIng:
    """Adaptador de LectorPdf que lee el "Certificado de Movimientos" en PDF
    de ING: a diferencia del Excel, no trae columnas de categoría ni
    subcategoría (se resuelven aparte, por asociación de descripción, al
    importar)."""

    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosPdfLeidos:
        if not nombre_fichero.lower().endswith(".pdf"):
            raise ExtensionNoSoportadaError(
                f"Extensión no soportada en '{nombre_fichero}'; solo se admiten .xls, .xlsx y .pdf"
            )

        lineas = self._extraer_lineas(contenido)

        numero_cuenta = self._buscar_numero_cuenta(lineas)
        if numero_cuenta is None:
            raise CabeceraNoReconocidaError("No se ha encontrado el número de cuenta en el PDF")
        titular = self._buscar_titular(lineas)

        filas = self._leer_filas(lineas)
        if not filas:
            raise FicheroSinMovimientosError("El fichero no contiene ninguna fila de movimientos")

        return DatosPdfLeidos(
            cabecera=CabeceraExcel(numero_cuenta=numero_cuenta, titular=titular),
            filas=filas,
        )

    def _extraer_lineas(self, contenido: bytes) -> list[str]:
        lineas: list[str] = []
        with pdfplumber.open(io.BytesIO(contenido)) as pdf:
            for pagina in pdf.pages:
                texto = pagina.extract_text() or ""
                lineas.extend(linea.strip() for linea in texto.splitlines() if linea.strip())
        return lineas

    def _buscar_numero_cuenta(self, lineas: list[str]) -> str | None:
        return next((linea for linea in lineas if _PATRON_NUMERO_CUENTA.match(linea)), None)

    def _buscar_titular(self, lineas: list[str]) -> str | None:
        for linea in lineas:
            coincidencia = _PATRON_TITULAR.match(linea)
            if coincidencia:
                return coincidencia.group(1).strip()
        return None

    def _leer_filas(self, lineas: list[str]) -> list[FilaMovimientoPdf]:
        filas: list[FilaMovimientoPdf] = []
        for linea in lineas:
            coincidencia = _PATRON_MOVIMIENTO.match(linea)
            if coincidencia is None:
                continue
            dia, mes, anio, concepto, importe, saldo = coincidencia.groups()
            filas.append(
                FilaMovimientoPdf(
                    fecha_valor=datetime.date(int(anio), int(mes), int(dia)),
                    descripcion=" ".join(concepto.split()),
                    importe=_a_decimal(importe),
                    saldo=_a_decimal(saldo),
                )
            )
        return filas
