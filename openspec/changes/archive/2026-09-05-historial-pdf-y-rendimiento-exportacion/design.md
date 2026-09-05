# Design: Historial coherente, importación PDF y límite de exportación

## Enfoque técnico

Documentación retroactiva (implementación y verificación ya completadas y
fusionadas en `main` mediante PRs independientes antes de escribir este
documento).

## Decisiones de arquitectura

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Historial reutiliza `resolver_categoria_movimiento_real` (generalizado para aceptar `categoria_id`/`subcategoria_id` sueltos, no solo un `ConceptoPrevisto`) y un nuevo caso de uso `ListarMovimientosPorCategoriaResumen` | Duplicar la lógica de resolución de asociaciones dentro de Historial | Una sola fuente de verdad para "qué movimientos pertenecen a este concepto", compartida con Resumen anual |
| Nuevo endpoint `GET /previsiones/movimientos-por-categoria`, en vez de modificar `GET /movimientos` | Añadir el parámetro a `GET /movimientos` | `GET /movimientos` es genérico y lo usan otras vistas (p. ej. Movimientos) que no deben empezar a resolver asociaciones sin que se pida explícitamente |
| Lector de PDF con `pdfplumber` (Python puro) | Invocar `pdftotext` (binario del sistema) | Portabilidad en Docker sin instalar `poppler-utils`; `pdfplumber` reconstruye cada movimiento en una sola línea de texto, más fácil de parsear con una expresión regular |
| Categoría "Sin categorizar" como fallback (creada bajo demanda) | Permitir `categoria_id` nulo en `Movimiento` | `categoria_id` ya es obligatorio en todo el dominio; añadir nulabilidad habría afectado a muchas más piezas para un caso poco frecuente |
| Campo `origen` en `Movimiento`, de solo lectura fuera de la importación (el repositorio lo ignora deliberadamente en `actualizar()`) | Guardar el origen en una tabla aparte, o dejar que se pierda al editar | Mantener la marca simple (una columna) y estable ante ediciones posteriores del movimiento |
| Reconocimiento de cuenta por PDF comparando número sin espacios (`replace(" ", "")`) en la capa de aplicación de `ImportarMovimientosPdf` | Reformatear el número al mismo agrupamiento que usa el Excel | El agrupamiento de espacios del Excel no sigue una regla fija reproducible; comparar sin espacios es robusto sin necesidad de adivinar el formato exacto |
| Límite de años como restricción de `Query` en FastAPI (`ge`/`le`), no como validación de negocio en el caso de uso | Validar en `ExportarResumenAnualExcel.ejecutar()` | Al ser una restricción de esquema, Schemathesis ya no genera rangos amplios: el fix resuelve el problema de rendimiento en el origen, no solo lo enmascara con un rechazo tardío |

## Flujo de datos: importación de PDF

```
Fichero PDF ──▶ LectorPdfIng.leer() ──▶ DatosPdfLeidos (cabecera + filas sin categoría)
                                              │
                                              ▼
                              ImportarMovimientosPdf.ejecutar()
                                              │
                     ┌────────────────────────┼─────────────────────────┐
                     ▼                        ▼                         ▼
        resolver cuenta (por CCC       para cada fila:              detectar
        sin espacios, o crearla)       buscar asociación            duplicado
                                        por descripción              (igual que
                                        → categoría/sub              Excel)
                                        o "Sin categorizar"
```

## Interfaces / Contratos

```python
class LectorPdf(Protocol):
    def leer(self, contenido: bytes, nombre_fichero: str) -> DatosPdfLeidos: ...

@dataclass(frozen=True)
class FilaMovimientoPdf:
    fecha_valor: datetime.date
    descripcion: str
    importe: Decimal
    saldo: Decimal
```

`POST /movimientos/importar` (sin cambios en la firma HTTP): el router
decide `ImportarMovimientosExcel` o `ImportarMovimientosPdf` según la
extensión del fichero subido.

## Estrategia de pruebas

| Capa | Qué se probó | Cómo |
|---|---|---|
| Unitaria | Resolución de asociaciones (incluida especificidad entre solapadas), fallback "Sin categorizar", reconocimiento de cuenta con espaciado distinto | Dobles en memoria (`tests/unitarios/aplicacion`) |
| Unitaria | Parseo del PDF de ING (fixture sintético, sin datos reales) | `tests/unitarios/infraestructura/test_lector_pdf_ing.py` |
| Integración | `origen` persiste al crear y se conserva al actualizar | `tests/integracion/test_repositorio_movimientos.py` |
| Integración | Límite de años en el endpoint de exportación | `tests/unitarios/interfaces/test_limites_exportar_resumen_anual.py` (TestClient) |
| E2E | Flujo completo de importación de PDF (subida, alta de cuenta/movimientos, icono de origen) | `frontend/e2e/importar-excel.spec.ts` |
| E2E | Historial encuentra movimientos solo localizables por asociación de descripción | `frontend/e2e/historial.spec.ts` |
| Contrato | Schemathesis contra el endpoint de exportación, antes y después del límite | `tests/contrato/test_contrato_openapi.py` (15-19 min → 26 s) |

## Migración / Despliegue

Migración Alembic aditiva (`origen` nullable en `movimientos`); se aplica
automáticamente al arrancar el contenedor backend (`entrypoint.sh`). Sin
pasos manuales.

## Preguntas abiertas

- [ ] El parseo del PDF está acoplado al formato concreto del certificado de
      ING; si el banco cambia el formato, o se necesita soportar otro banco,
      haría falta un nuevo `LectorPdf`.
