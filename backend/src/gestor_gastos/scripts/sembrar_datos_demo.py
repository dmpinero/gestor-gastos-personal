"""Siembra un conjunto de datos de ejemplo (ficticios) en la base de datos
para poder evaluar la aplicación con contenido realista, sin usar datos
financieros reales.

Uso (dentro del contenedor backend, o con el entorno local activado):

    python -m gestor_gastos.scripts.sembrar_datos_demo

Por seguridad, el script se niega a ejecutarse si ya existe alguna cuenta
bancaria: así nunca mezcla datos de ejemplo con datos reales ya cargados. Si
se quiere partir de cero, hay que vaciar la base de datos antes (en Docker:
`docker compose down -v && docker compose up -d --build`).
"""

import datetime
import random
import sys
from decimal import ROUND_HALF_UP, Decimal

from gestor_gastos.aplicacion.categoria.crear_categoria import CrearCategoria
from gestor_gastos.aplicacion.categoria.crear_subcategoria import CrearSubcategoria
from gestor_gastos.aplicacion.cuenta.crear_cuenta import CrearCuenta
from gestor_gastos.aplicacion.movimiento.crear_movimiento import CrearMovimiento
from gestor_gastos.aplicacion.prevision.crear_concepto_previsto import CrearConceptoPrevisto
from gestor_gastos.dominio.prevision.entidades import Periodicidad
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_categorias_sqlalchemy import (  # noqa: E501
    RepositorioCategoriasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_cuentas_sqlalchemy import (  # noqa: E501
    RepositorioCuentasSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_movimientos_sqlalchemy import (  # noqa: E501
    RepositorioMovimientosSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.repositorios.repositorio_previsiones_sqlalchemy import (  # noqa: E501
    RepositorioPrevisionesSqlAlchemy,
)
from gestor_gastos.infraestructura.persistencia.sesion import FabricaSesiones

_SEMILLA = 20260101
_CENTAVO = Decimal("0.01")

_CATEGORIAS: dict[str, list[str]] = {
    "Nómina y otras prestaciones": ["Nómina", "Paga extra"],
    "Vivienda": ["Alquiler", "Suministros", "Comunidad"],
    "Alimentación": ["Supermercado", "Restaurantes"],
    "Transporte": ["Combustible", "Transporte público"],
    "Salud": ["Farmacia", "Seguro médico"],
    "Ocio y suscripciones": ["Streaming", "Ocio"],
    "Compras": ["Ropa", "Hogar"],
    "Educación": ["Formación"],
    "Ahorro": [],
}

# (categoría, subcategoría, descripción, importe base, variación %, día del mes)
_GASTOS_FIJOS_MENSUALES = [
    ("Vivienda", "Alquiler", "Alquiler piso", Decimal("-750.00"), 0, 1),
    ("Vivienda", "Suministros", "Factura luz y gas", Decimal("-85.00"), 20, 5),
    ("Vivienda", "Comunidad", "Cuota comunidad de propietarios", Decimal("-42.00"), 0, 3),
    ("Salud", "Seguro médico", "Recibo seguro médico", Decimal("-48.50"), 0, 7),
    ("Ocio y suscripciones", "Streaming", "Suscripción streaming", Decimal("-12.99"), 0, 10),
]

# (categoría, subcategoría, descripciones posibles, (min, max) ocurrencias/mes, (min, max) importe)
_GASTOS_VARIABLES = [
    (
        "Alimentación",
        "Supermercado",
        ["Mercadona", "Carrefour", "Lidl", "Dia"],
        (3, 6),
        (-95, -35),
    ),
    (
        "Alimentación",
        "Restaurantes",
        ["Restaurante La Plaza", "Bar Los Amigos", "Pizzería Napoli"],
        (0, 3),
        (-60, -15),
    ),
    ("Transporte", "Combustible", ["Repsol", "Cepsa", "BP"], (1, 3), (-70, -40)),
    ("Transporte", "Transporte público", ["Abono transporte"], (0, 1), (-40, -40)),
    (
        "Ocio y suscripciones",
        "Ocio",
        ["Cine", "Entradas concierto", "Taquilla online"],
        (0, 2),
        (-45, -10),
    ),
    ("Salud", "Farmacia", ["Farmacia"], (0, 2), (-35, -8)),
    ("Compras", "Ropa", ["Zara", "H&M", "Decathlon"], (0, 1), (-90, -20)),
    ("Compras", "Hogar", ["Ikea", "Leroy Merlin"], (0, 1), (-120, -15)),
]

_CONCEPTOS_PREVISTOS: list[tuple[str, str | None, Periodicidad, Decimal, int | None]] = [
    ("Nómina y otras prestaciones", "Nómina", "mensual", Decimal("1900.00"), None),
    ("Nómina y otras prestaciones", "Paga extra", "semestral", Decimal("1900.00"), 6),
    ("Vivienda", "Alquiler", "mensual", Decimal("-750.00"), None),
    ("Vivienda", "Suministros", "mensual", Decimal("-85.00"), None),
    ("Vivienda", "Comunidad", "mensual", Decimal("-42.00"), None),
    ("Salud", "Seguro médico", "mensual", Decimal("-48.50"), None),
    ("Ocio y suscripciones", "Streaming", "mensual", Decimal("-12.99"), None),
    ("Alimentación", "Supermercado", "mensual", Decimal("-300.00"), None),
    ("Transporte", "Combustible", "mensual", Decimal("-120.00"), None),
    ("Educación", "Formación", "anual", Decimal("-300.00"), 3),
]

_SALDO_INICIAL_CORRIENTE = Decimal("1500.00")
_SALDO_INICIAL_AHORRO = Decimal("3000.00")
_TRANSFERENCIA_AHORRO_MENSUAL = Decimal("150.00")


def _redondear(importe: Decimal) -> Decimal:
    return importe.quantize(_CENTAVO, rounding=ROUND_HALF_UP)


def _meses_entre(inicio: datetime.date, fin: datetime.date) -> list[datetime.date]:
    meses = []
    cursor = inicio.replace(day=1)
    while cursor <= fin:
        meses.append(cursor)
        if cursor.month == 12:
            cursor = cursor.replace(year=cursor.year + 1, month=1)
        else:
            cursor = cursor.replace(month=cursor.month + 1)
    return meses


def _crear_cuentas(
    repositorio: RepositorioCuentasSqlAlchemy,
) -> tuple[int, int]:
    caso_de_uso = CrearCuenta(repositorio)
    corriente = caso_de_uso.ejecutar(
        numero_cuenta="ES00 0000 0000 0000 0000 0001",
        alias="Cuenta Corriente",
        entidad_bancaria="Banco Ejemplo",
        moneda="EUR",
        titular="Usuario Demo",
    )
    ahorro = caso_de_uso.ejecutar(
        numero_cuenta="ES00 0000 0000 0000 0000 0002",
        alias="Cuenta de Ahorro",
        entidad_bancaria="Banco Ejemplo",
        moneda="EUR",
        titular="Usuario Demo",
    )
    assert corriente.id is not None
    assert ahorro.id is not None
    return corriente.id, ahorro.id


def _crear_categorias(
    repositorio: RepositorioCategoriasSqlAlchemy,
) -> tuple[dict[str, int], dict[tuple[str, str], int]]:
    caso_crear_categoria = CrearCategoria(repositorio)
    caso_crear_subcategoria = CrearSubcategoria(repositorio)

    ids_categoria: dict[str, int] = {}
    ids_subcategoria: dict[tuple[str, str], int] = {}
    for nombre_categoria, subcategorias in _CATEGORIAS.items():
        categoria = caso_crear_categoria.ejecutar(nombre_categoria)
        assert categoria.id is not None
        ids_categoria[nombre_categoria] = categoria.id
        for nombre_subcategoria in subcategorias:
            subcategoria = caso_crear_subcategoria.ejecutar(categoria.id, nombre_subcategoria)
            assert subcategoria.id is not None
            ids_subcategoria[(nombre_categoria, nombre_subcategoria)] = subcategoria.id

    return ids_categoria, ids_subcategoria


def _crear_conceptos_previstos(
    repositorio: RepositorioPrevisionesSqlAlchemy,
    repositorio_categorias: RepositorioCategoriasSqlAlchemy,
    ids_categoria: dict[str, int],
    ids_subcategoria: dict[tuple[str, str], int],
) -> None:
    caso_de_uso = CrearConceptoPrevisto(repositorio, repositorio_categorias)
    for (
        nombre_categoria,
        nombre_subcategoria,
        periodicidad,
        importe,
        mes_inicio,
    ) in _CONCEPTOS_PREVISTOS:
        subcategoria_id = (
            ids_subcategoria[(nombre_categoria, nombre_subcategoria)]
            if nombre_subcategoria is not None
            else None
        )
        caso_de_uso.ejecutar(
            categoria_id=ids_categoria[nombre_categoria],
            subcategoria_id=subcategoria_id,
            periodicidad=periodicidad,
            importe_previsto=importe,
            mes_inicio=mes_inicio,
        )


def _ultimo_dia_natural(inicio_mes: datetime.date) -> int:
    return (
        (inicio_mes.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
        - datetime.timedelta(days=1)
    ).day


def _generar_movimientos(
    aleatorio: random.Random,
    meses: list[datetime.date],
    hoy: datetime.date,
) -> list[tuple[datetime.date, str, str, str | None, Decimal]]:
    """Genera (fecha, descripcion, categoria, subcategoria, importe) para la
    cuenta corriente, en orden cronológico. No incluye las transferencias a
    la cuenta de ahorro (se calculan aparte, a importe fijo).

    En el mes en curso nunca se generan movimientos con fecha posterior a
    `hoy` (no tendría sentido un movimiento bancario fechado en el futuro).
    """
    movimientos: list[tuple[datetime.date, str, str, str | None, Decimal]] = []

    for inicio_mes in meses:
        es_mes_actual = (inicio_mes.year, inicio_mes.month) == (hoy.year, hoy.month)
        limite_dia = hoy.day if es_mes_actual else _ultimo_dia_natural(inicio_mes)

        importe_nomina = Decimal(aleatorio.randint(180000, 205000)) / 100
        movimientos.append(
            (
                inicio_mes.replace(day=1),
                "Nómina",
                "Nómina y otras prestaciones",
                "Nómina",
                importe_nomina,
            )
        )
        if inicio_mes.month in (6, 12):
            movimientos.append(
                (
                    inicio_mes.replace(day=1),
                    "Paga extra",
                    "Nómina y otras prestaciones",
                    "Paga extra",
                    importe_nomina,
                )
            )

        for (
            categoria,
            subcategoria,
            descripcion,
            importe_base,
            variacion_pct,
            dia,
        ) in _GASTOS_FIJOS_MENSUALES:
            if dia > limite_dia:
                continue
            factor = 1 + Decimal(aleatorio.uniform(-variacion_pct, variacion_pct)) / 100
            movimientos.append(
                (
                    inicio_mes.replace(day=dia),
                    descripcion,
                    categoria,
                    subcategoria,
                    _redondear(importe_base * factor),
                )
            )

        for (
            categoria,
            subcategoria,
            descripciones,
            rango_ocurrencias,
            rango_importe,
        ) in _GASTOS_VARIABLES:
            ocurrencias = aleatorio.randint(*rango_ocurrencias)
            for _ in range(ocurrencias):
                dia = aleatorio.randint(1, limite_dia)
                centavos = aleatorio.randint(rango_importe[0] * 100, rango_importe[1] * 100)
                importe = Decimal(centavos) / 100
                movimientos.append(
                    (
                        inicio_mes.replace(day=dia),
                        aleatorio.choice(descripciones),
                        categoria,
                        subcategoria,
                        _redondear(importe),
                    )
                )

        if inicio_mes.month == 3 and limite_dia >= 15:
            movimientos.append(
                (
                    inicio_mes.replace(day=15),
                    "Curso de formación",
                    "Educación",
                    "Formación",
                    Decimal("-280.00"),
                )
            )

        if limite_dia >= 2:
            movimientos.append(
                (
                    inicio_mes.replace(day=2),
                    "Transferencia a cuenta de ahorro",
                    "Ahorro",
                    None,
                    -_TRANSFERENCIA_AHORRO_MENSUAL,
                )
            )

    movimientos.sort(key=lambda m: m[0])
    return movimientos


def _generar_transferencias_ahorro(
    meses: list[datetime.date], hoy: datetime.date
) -> list[datetime.date]:
    """Fechas (una por mes, el día 2) en las que la cuenta de ahorro recibe
    la transferencia correspondiente de la cuenta corriente. Se omite el mes
    en curso si todavía no se ha llegado al día 2.
    """
    fechas = []
    for inicio_mes in meses:
        es_mes_actual = (inicio_mes.year, inicio_mes.month) == (hoy.year, hoy.month)
        limite_dia = hoy.day if es_mes_actual else _ultimo_dia_natural(inicio_mes)
        if limite_dia >= 2:
            fechas.append(inicio_mes.replace(day=2))
    return fechas


def _poblar_movimientos(
    repositorio: RepositorioMovimientosSqlAlchemy,
    repositorio_cuentas: RepositorioCuentasSqlAlchemy,
    repositorio_categorias: RepositorioCategoriasSqlAlchemy,
    cuenta_corriente_id: int,
    cuenta_ahorro_id: int,
    ids_categoria: dict[str, int],
    ids_subcategoria: dict[tuple[str, str], int],
    movimientos_corriente: list[tuple[datetime.date, str, str, str | None, Decimal]],
    fechas_transferencia_ahorro: list[datetime.date],
) -> int:
    caso_de_uso = CrearMovimiento(repositorio, repositorio_cuentas, repositorio_categorias)
    ahorro_categoria_id = ids_categoria["Ahorro"]
    total_creados = 0

    saldo_corriente = _SALDO_INICIAL_CORRIENTE
    for fecha, descripcion, categoria, subcategoria, importe in movimientos_corriente:
        subcategoria_id = (
            ids_subcategoria[(categoria, subcategoria)] if subcategoria is not None else None
        )
        saldo_corriente = _redondear(saldo_corriente + importe)
        caso_de_uso.ejecutar(
            cuenta_id=cuenta_corriente_id,
            categoria_id=ids_categoria[categoria],
            subcategoria_id=subcategoria_id,
            fecha_valor=fecha,
            descripcion=descripcion,
            importe=importe,
            saldo=saldo_corriente,
        )
        total_creados += 1

    saldo_ahorro = _SALDO_INICIAL_AHORRO
    for fecha in fechas_transferencia_ahorro:
        saldo_ahorro = _redondear(saldo_ahorro + _TRANSFERENCIA_AHORRO_MENSUAL)
        caso_de_uso.ejecutar(
            cuenta_id=cuenta_ahorro_id,
            categoria_id=ahorro_categoria_id,
            fecha_valor=fecha,
            descripcion="Transferencia desde cuenta corriente",
            importe=_TRANSFERENCIA_AHORRO_MENSUAL,
            saldo=saldo_ahorro,
        )
        total_creados += 1

    return total_creados


def main() -> None:
    sesion = FabricaSesiones()
    try:
        repositorio_cuentas = RepositorioCuentasSqlAlchemy(sesion)
        if repositorio_cuentas.listar():
            print(
                "La base de datos ya tiene al menos una cuenta bancaria creada.\n"
                "Para no mezclar datos de ejemplo con datos ya existentes, este "
                "script no hace nada.\n"
                "Si quieres partir de cero: docker compose down -v && "
                "docker compose up -d --build",
                file=sys.stderr,
            )
            sys.exit(1)

        repositorio_categorias = RepositorioCategoriasSqlAlchemy(sesion)
        repositorio_movimientos = RepositorioMovimientosSqlAlchemy(sesion)
        repositorio_previsiones = RepositorioPrevisionesSqlAlchemy(sesion)

        aleatorio = random.Random(_SEMILLA)

        print("Creando cuentas bancarias...")
        cuenta_corriente_id, cuenta_ahorro_id = _crear_cuentas(repositorio_cuentas)

        print("Creando categorías y subcategorías...")
        ids_categoria, ids_subcategoria = _crear_categorias(repositorio_categorias)

        print("Creando conceptos previstos (para el Resumen anual)...")
        _crear_conceptos_previstos(
            repositorio_previsiones, repositorio_categorias, ids_categoria, ids_subcategoria
        )

        hoy = datetime.date.today()
        inicio = datetime.date(hoy.year - 1, 1, 1)
        meses = _meses_entre(inicio, hoy)

        print(f"Generando movimientos de {inicio:%m/%Y} a {hoy:%m/%Y}...")
        movimientos_corriente = _generar_movimientos(aleatorio, meses, hoy)
        fechas_transferencia_ahorro = _generar_transferencias_ahorro(meses, hoy)
        total_creados = _poblar_movimientos(
            repositorio_movimientos,
            repositorio_cuentas,
            repositorio_categorias,
            cuenta_corriente_id,
            cuenta_ahorro_id,
            ids_categoria,
            ids_subcategoria,
            movimientos_corriente,
            fechas_transferencia_ahorro,
        )

        print(
            f"Listo: 2 cuentas, {len(ids_categoria)} categorías, "
            f"{len(ids_subcategoria)} subcategorías, {len(_CONCEPTOS_PREVISTOS)} "
            f"conceptos previstos y {total_creados} movimientos de ejemplo."
        )
    finally:
        sesion.close()


if __name__ == "__main__":
    main()
