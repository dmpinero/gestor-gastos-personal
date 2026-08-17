# Informe de verificación

**Cambio**: gestion-cuentas-y-movimientos
**Fecha**: 2026-08-17

---

## Completitud

| Métrica | Valor |
|---|---|
| Tareas totales | 47 (+ 2 añadidas durante la implementación) |
| Tareas completadas | 49 |
| Tareas incompletas | 0 |

Todas las tareas de `tasks.md` están marcadas `[x]`. Se añadieron dos tareas no
previstas en el desglose original (proxy Nginx/Vite y healthcheck del backend
en `docker-compose.yml`), necesarias porque el diseño no contemplaba cómo el
frontend alcanzaría al backend en Docker/CI; están documentadas y resueltas.

---

## Ejecución de build y tests (real)

**Backend — lint/seguridad/arquitectura**: ✅ Pasado
```
ruff check: All checks passed!
ruff format --check: 107 files formatted (tras aplicar el formateo pendiente)
bandit -r src: sin hallazgos
lint-imports: Capas de la arquitectura hexagonal KEPT (129 dependencias analizadas)
```

**Backend — tests**: ✅ 88 passed / 0 failed
- Unitarios (dominio/aplicación/infraestructura): incluidos en el total
- Integración (MySQL real): incluidos en el total
- BDD (pytest-bdd, español): 10 escenarios, incluidos en el total
- Contrato (Schemathesis sobre el OpenAPI real): incluidos en el total

**Backend — cobertura**: 96% (umbral: 80%) → ✅ Por encima del umbral
Puntos con menor cobertura (no críticos): `trazas.py` 69% y `sentry.py` 83%
(ramas de configuración de observabilidad no ejercitadas sin DSN/endpoint
configurados, esperable); `repositorio_movimientos_sqlalchemy.py` 68% (rama
`actualizar`, cubierta indirectamente vía API pero no con un test de
integración dedicado — ver WARNING).

**Frontend — lint/tipos**: ✅ Pasado (`eslint .`, `vue-tsc --build` sin errores)

**Frontend — tests**: ✅ 12 passed / 0 failed (4 ficheros de test)

**Frontend — build**: ✅ Pasado (`vite build`, 110 kB bundle)

**E2E (Playwright, navegador real contra la pila Docker completa)**: ✅ 7 passed / 0 failed
- `cuentas.spec.ts`, `categorias.spec.ts`, `movimientos.spec.ts`,
  `importar-excel.spec.ts` (2 tests), `inicio.spec.ts` (2 tests, incluye
  accesibilidad WCAG 2.1 AA)
- 20 capturas de pantalla generadas en `frontend/e2e/capturas/`

**Coverage threshold**: 80% configurado en el ci-backend.yml (`--cov-fail-under=80`) → ✅ 95% real, por encima.

---

## Matriz de cumplimiento de specs

### cuenta-bancaria

| Requisito | Escenario | Test | Resultado |
|---|---|---|---|
| Alta de cuenta bancaria | Alta correcta | `test_casos_uso_cuenta.py::test_crear_cuenta_la_guarda_y_le_asigna_id`; BDD `cuenta-bancaria.feature::Alta correcta de una cuenta` | ✅ COMPLIANT |
| Alta de cuenta bancaria | Número de cuenta duplicado | `test_crear_cuenta_con_numero_ya_existente_falla`; BDD `No se permite un número de cuenta duplicado` | ✅ COMPLIANT |
| Edición de cuenta bancaria | Editar alias | `test_actualizar_cuenta_cambia_el_alias` | ✅ COMPLIANT |
| Baja de cuenta bancaria | Baja sin movimientos | `test_eliminar_cuenta_sin_movimientos_la_borra` | ✅ COMPLIANT |
| Baja de cuenta bancaria | Baja bloqueada por movimientos existentes | `test_eliminar_cuenta_con_movimientos_falla` | ✅ COMPLIANT |
| Listado de cuentas | Listado vacío | `test_listar_cuentas_vacio_devuelve_lista_vacia` | ✅ COMPLIANT |

### categoria (incluye subcategoría)

| Requisito | Escenario | Test | Resultado |
|---|---|---|---|
| Alta de categoría | Alta correcta | `test_casos_uso_categoria.py::test_crear_categoria_la_guarda`; BDD `categoria.feature` | ✅ COMPLIANT |
| Alta de categoría | Nombre duplicado | `test_crear_categoria_con_nombre_duplicado_falla` | ✅ COMPLIANT |
| Edición y baja de categoría | Baja bloqueada por subcategorías | `test_eliminar_categoria_con_subcategorias_falla` | ✅ COMPLIANT |
| Alta de subcategoría | Alta correcta | BDD `Alta de una subcategoría bajo una categoría existente`; `test_mismo_nombre_de_subcategoria_en_categorias_distintas_permitido` (cubre alta) | ✅ COMPLIANT |
| Alta de subcategoría | Nombre duplicado en la misma categoría | `test_crear_subcategoria_con_nombre_duplicado_en_misma_categoria_falla` | ✅ COMPLIANT |
| Alta de subcategoría | Mismo nombre en categorías distintas permitido | `test_mismo_nombre_de_subcategoria_en_categorias_distintas_permitido` | ✅ COMPLIANT |
| Edición y baja de subcategoría | Baja bloqueada por movimientos | `test_eliminar_subcategoria_con_movimientos_falla` | ✅ COMPLIANT |
| Listado jerárquico | Categoría sin subcategorías | `test_listar_categorias_sin_subcategorias_devuelve_lista_vacia` | ✅ COMPLIANT |

### movimiento

| Requisito | Escenario | Test | Resultado |
|---|---|---|---|
| Alta manual de movimiento | Alta correcta de un cargo | `test_casos_uso_movimiento.py::test_crear_movimiento_de_cargo`; BDD `Alta correcta de un movimiento de cargo` | ✅ COMPLIANT |
| Alta manual de movimiento | Alta correcta de un abono | `test_crear_movimiento_de_abono_no_tiene_restriccion_de_signo` | ✅ COMPLIANT |
| Alta manual de movimiento | Falta un campo obligatorio | `test_esquemas_movimiento.py::test_falta_descripcion_lanza_error_de_validacion`, `test_descripcion_vacia_lanza_error_de_validacion` | ✅ COMPLIANT |
| Edición de movimiento | Corregir categoría | `test_actualizar_movimiento_cambia_categoria` | ✅ COMPLIANT |
| Baja de movimiento | Baja correcta | `test_eliminar_movimiento_lo_borra` | ✅ COMPLIANT |
| Listado de movimientos | Listado ordenado | `test_listar_movimientos_ordenados_de_mas_reciente_a_mas_antiguo`; BDD `Los movimientos se listan del más reciente al más antiguo` | ✅ COMPLIANT |

### importación de Excel

| Requisito | Escenario | Test | Resultado |
|---|---|---|---|
| Subida del fichero | Extensión no soportada | `test_lector_excel_pandas.py::test_extension_no_soportada_lanza_error`; BDD; E2E `importar-excel.spec.ts` (2º test) | ✅ COMPLIANT |
| Extracción de cuenta | Cuenta nueva | `test_importar_movimientos_excel.py::test_importa_crea_cuenta_nueva_y_movimientos`; BDD; E2E (1º test) | ✅ COMPLIANT |
| Extracción de cuenta | Cuenta ya existente | `test_importa_reutiliza_cuenta_existente` | ✅ COMPLIANT |
| Localización tolerante de columnas | Cabecera no encontrada | `test_lector_excel_pandas.py::test_fichero_sin_cabecera_reconocible_lanza_error` (nivel lector); sin test HTTP end-to-end dedicado | ⚠️ PARTIAL |
| Alta automática de categorías/subcategorías | Categoría nueva detectada | `test_importa_crea_categorias_y_subcategorias_nuevas_una_sola_vez`; BDD (verifica `categorias_creadas`) | ✅ COMPLIANT |
| Deduplicación de movimientos | Reimportar el mismo fichero | `test_importa_omite_movimiento_duplicado`; BDD `Reimportar el mismo fichero...`; verificado también manualmente con el Excel real del usuario (69→0 importados en la 2ª subida) | ✅ COMPLIANT |
| Resumen de la importación | Resumen tras importación mixta (algunos nuevos, algunos duplicados en la misma llamada) | `test_importar_movimientos_excel.py::test_resumen_mixto_con_movimientos_nuevos_y_duplicados_en_la_misma_importacion` | ✅ COMPLIANT |
| Fichero sin movimientos | Fichero vacío de movimientos | `test_lector_excel_pandas.py::test_fichero_sin_filas_de_movimientos_lanza_error` | ✅ COMPLIANT |

**Resumen de cumplimiento**: 24/25 escenarios COMPLIANT, 1/25 PARTIAL, 0 FAILING, 0 UNTESTED.

---

## Corrección (estático — evidencia estructural)

| Requisito | Estado | Notas |
|---|---|---|
| Las 4 entidades con CRUD API+UI | ✅ Implementado | Routers, esquemas, stores y vistas para las 4 |
| Migración Alembic aditiva | ✅ Implementado | Una única migración, upgrade/downgrade verificados |
| Import-linter (capas Clean Architecture) | ✅ Implementado | Contrato en verde, dominio sin dependencias externas |

---

## Coherencia (diseño)

| Decisión | ¿Seguida? | Notas |
|---|---|---|
| Reglas "no borrar si tiene hijos" a nivel de aplicación | ✅ Sí | `EntidadConDependenciasError` en los 3 casos de uso de eliminación |
| Deduplicación comprobada en el caso de uso (no solo constraint de BD) | ✅ Sí, mejorado | Además se añadió un `UNIQUE` real en BD como red de seguridad (el diseño solo preveía un índice no único) |
| `.xls`→xlrd, `.xlsx`→openpyxl por extensión | ✅ Sí | |
| Localización de cabecera por nombre, no por índice fijo | ✅ Sí | Verificado contra el Excel real del usuario (69 movimientos) |
| `LectorExcel` como puerto en `dominio/importacion/` | ✅ Sí | Cumple el contrato de import-linter |
| Rutas `/{id}` genéricas | ⚠️ Mejorado respecto al diseño | Se añadió el conversor `:int` (`/{id_movimiento:int}`) tras detectar con Schemathesis que `/movimientos/importar` colisionaba con `/movimientos/{id_movimiento}` |
| Proxy frontend→backend | ⚠️ No estaba en el diseño | Gap real: el diseño no especificaba cómo el frontend alcanzaría al backend en Docker; se añadió proxy Nginx/Vite (ver tasks.md) |

---

## Hallazgos

**CRITICAL**: Ninguno.

**WARNING**:
1. Sin test dedicado para el caso "cabecera de columnas no reconocida" a nivel HTTP end-to-end (solo a nivel del lector, en `test_lector_excel_pandas.py`).
2. `RepositorioMovimientosSqlAlchemy.actualizar` tiene menor cobertura de integración directa (68%) aunque se ejerce indirectamente vía el test E2E de edición de movimientos.

**SUGGESTION**:
1. Considerar mover la validación "no vacío" de campos de texto también a nivel de dominio, no solo Pydantic, si en el futuro se añaden más adaptadores de entrada (CLI, otra API).

**Resuelto durante esta verificación** (ya no aplica):
- Se añadieron `test_esquemas_movimiento.py` (campo obligatorio) y
  `test_resumen_mixto_con_movimientos_nuevos_y_duplicados_en_la_misma_importacion`,
  cerrando 2 de los 3 huecos detectados inicialmente.

---

## Veredicto

**PASS WITH WARNINGS**

Las 4 specs están implementadas y verificadas con evidencia de ejecución real
(88 tests backend con 96% cobertura, 12 tests frontend, 7 E2E contra la pila
Docker completa, e importación validada además con el Excel real del
usuario). Solo queda 1 hueco de cobertura puntual (documentado como WARNING),
que no bloquea el archivado del cambio.
