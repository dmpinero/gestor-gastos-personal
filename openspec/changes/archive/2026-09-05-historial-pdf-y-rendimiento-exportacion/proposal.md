# Propuesta: Historial coherente con asociaciones, importación desde PDF y límite de rendimiento en exportación

## Intención

Documentación retroactiva: este cambio se implementó y fusionó ya (varios PR
independientes) sin pasar por el flujo SDD. Se registra aquí para que
`openspec/specs/` refleje el estado real del sistema, y a partir de ahora los
cambios nuevos sí pasarán por `sdd-propose` → `sdd-spec` → `sdd-design` →
`sdd-tasks` → `sdd-archive`.

Motivación original de cada pieza:
- El Historial navegaba por la categoría/subcategoría literal del movimiento,
  ignorando las asociaciones (por concepto o por descripción) que ya usa el
  Resumen anual: una subcategoría como "Amazon Prime" (cuyos movimientos
  reales viven bajo otra categoría) aparecía vacía en Historial pese a sumar
  correctamente en el Resumen anual.
- No existía forma de importar movimientos antiguos que solo estaban
  disponibles como certificado bancario en PDF (sin columnas de
  categoría/subcategoría, a diferencia del Excel).
- Al auditar datos reales se detectó que `GET /previsiones/resumen-anual/exportar`
  no acotaba el rango de años, permitiendo peticiones que tardaban minutos
  (schemathesis lo detectó fuzzeando el contrato OpenAPI).

## Alcance

### Dentro de alcance
- Historial: resolver categoría/subcategoría por asociación al listar movimientos.
- Importación de movimientos: aceptar también certificados en PDF, con
  autocategorización por descripción y marca visual de origen.
- Exportación del resumen anual: limitar el rango de años a uno razonable.

### Fuera de alcance
- Backfill completo de especificaciones de Resumen anual/Asociaciones/PDF que
  ya existían antes de esta sesión (spec previamente inexistente; aquí solo se
  documenta el delta de este cambio, no toda la funcionalidad histórica).
- Correcciones puramente internas sin comportamiento observable nuevo
  (desempate de saldo en el mismo día, normalización de espacios en la
  detección de duplicados): ya cubiertas por los requisitos existentes de
  "Listado de movimientos" y "Deduplicación de movimientos"; no añaden
  requisitos nuevos, solo corrigen su implementación.

## Enfoque

Cuatro entregas independientes, cada una en su propio PR ya fusionado:
1. `ListarMovimientosPorCategoriaResumen` (backend) + store/vista de Historial
   (frontend): mismo mecanismo de resolución de asociaciones que ya usa
   Resumen anual, reutilizado para Historial.
2. `ImportarMovimientosPdf` + `LectorPdfIng` (backend): mismo patrón que
   `ImportarMovimientosExcel`, pero sin columnas de categoría; resuelve por
   asociación de descripción con fallback a "Sin categorizar". El endpoint
   `POST /movimientos/importar` ya existente elige el caso de uso según la
   extensión del fichero.
3. Campo `origen` en `Movimiento` (solo escrito por la importación PDF,
   inmutable al editar) + icono en las tablas de Movimientos/Historial.
4. Límite `[2018, año actual + 1]` en `anio_desde`/`anio_hasta` del endpoint
   de exportación.

## Áreas afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `backend/.../aplicacion/prevision/listar_movimientos_por_categoria_resumen.py` | Nuevo | Resuelve movimientos de Historial vía asociaciones |
| `backend/.../aplicacion/importacion/importar_movimientos_pdf.py` | Nuevo | Importación desde PDF |
| `backend/.../infraestructura/importacion/lector_pdf_ing.py` | Nuevo | Parseo del certificado PDF de ING |
| `backend/.../dominio/movimiento/entidades.py` | Modificado | Campo `origen` |
| `backend/alembic/versions/...añadir_origen_a_movimientos.py` | Nuevo | Migración |
| `backend/.../interfaces/api/v1/enrutadores/prevision.py` | Modificado | Límite de años en exportación |
| `frontend/src/vistas/VistaHistorialGastos.vue`, `stores/movimientos.ts` | Modificado | Historial usa el nuevo endpoint |
| `frontend/src/componentes/compartido/IconoOrigenPdf.vue` | Nuevo | Icono de origen PDF |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| El parseo del PDF de ING no generaliza a otros formatos de certificado | Media | Documentado como limitación conocida; falla con `CabeceraNoReconocidaError`/`FicheroSinMovimientosError` en vez de datos incorrectos |
| Rango de exportación demasiado estricto para un caso de uso real futuro | Baja | Límite basado en el escenario BDD ya existente (año actual + 1 para planificación) |

## Plan de rollback

Cada pieza es un PR independiente ya fusionado; revertir el commit de merge
correspondiente en `main` deshace cada una sin afectar a las demás. La
migración de `origen` es aditiva (columna nullable): revertirla no pierde
datos de negocio, solo la marca de origen.

## Dependencias

Ninguna externa nueva relevante a largo plazo: `pdfplumber` (backend, PDF).

## Criterios de éxito

- [x] Historial muestra los mismos movimientos que el Resumen anual para una
      categoría/subcategoría con asociación.
- [x] Un PDF de certificado de movimientos de ING se importa correctamente,
      autocategorizado donde hay asociación, "Sin categorizar" donde no.
- [x] `GET /previsiones/resumen-anual/exportar` responde en segundos para
      cualquier rango dentro de lo permitido, y rechaza rangos fuera de él.
