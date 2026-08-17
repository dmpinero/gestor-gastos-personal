# Tasks: Gestión de Cuentas y Movimientos

**Nota de privacidad**: el Excel real (`movements-1682026.xls`) tiene datos
personales reales (titular, número de cuenta, movimientos). El repo es
público: NUNCA se commitea ese fichero. Se genera un fixture sintético
equivalente para tests/BDD/E2E (tarea 7.1).

## Fase 1: Persistencia
- [x] 1.1 Modelos SQLAlchemy en `infraestructura/persistencia/modelos.py`: `CuentaBancaria`, `Categoria`, `Subcategoria`, `Movimiento` (FKs, `UNIQUE(numero_cuenta)`, `UNIQUE(categoria_id, nombre)` en subcategoría, índice de deduplicación en movimiento)
- [x] 1.2 `alembic revision --autogenerate` con las 4 tablas; revisar el script generado
- [x] 1.3 Verificar `alembic upgrade head` y `alembic downgrade -1` contra MySQL local

## Fase 2: Dominio
- [x] 2.1 `dominio/excepciones.py` compartido: `EntidadNoEncontradaError`, `EntidadConDependenciasError`, `NombreDuplicadoError`
- [x] 2.2 Test + entidad `CuentaBancaria` y puerto `RepositorioCuentas` en `dominio/cuenta/`
- [x] 2.3 Test + entidades `Categoria`/`Subcategoria` y puerto `RepositorioCategorias` en `dominio/categoria/`
- [x] 2.4 Test + entidad `Movimiento` y puerto `RepositorioMovimientos` en `dominio/movimiento/`
- [x] 2.5 Puerto `LectorExcel` y value object `ResumenImportacion` en `dominio/importacion/`

## Fase 3: Aplicación (TDD: test con repos fake → caso de uso)
- [x] 3.1 CRUD `CuentaBancaria` (`crear/listar/actualizar/eliminar_cuenta.py`), test de bloqueo si tiene movimientos
- [x] 3.2 CRUD `Categoria`/`Subcategoria`, tests de nombre duplicado y bloqueo por dependencias
- [x] 3.3 CRUD `Movimiento`, test de validación de campos obligatorios (incluye validación de FKs, añadida durante verificación)
- [x] 3.4 `importar_movimientos_excel.py`: orquesta lector + 3 repos, crea categorías/subcategorías nuevas, deduplica, arma `ResumenImportacion`; tests con lector fake (fila nueva, duplicada, categoría nueva, fichero vacío)

## Fase 4: Infraestructura
- [x] 4.1 `RepositorioCuentasSqlAlchemy` + test de integración (MySQL real)
- [x] 4.2 `RepositorioCategoriasSqlAlchemy` + test de integración
- [x] 4.3 `RepositorioMovimientosSqlAlchemy` + test de integración (incluye consulta de deduplicación)
- [x] 4.4 `LectorExcelPandas` (openpyxl/.xlsx, xlrd/.xls, localización de cabecera por nombre) + test unitario con fixture sintético

## Fase 5: API
- [x] 5.1 Esquemas Pydantic de las 4 entidades + `ResumenImportacionEsquema` (con `max_length`/`max_digits`, añadido durante verificación)
- [x] 5.2 Router `/cuentas` (CRUD) con mapeo de excepciones de dominio a HTTP (404/409/400)
- [x] 5.3 Router `/categorias` + subcategorías anidadas, mismo mapeo de errores
- [x] 5.4 Router `/movimientos` (CRUD, filtro `?cuenta_id=`), rutas con conversor `:int` (fix de ambigüedad de rutas)
- [x] 5.5 Router `/movimientos/importar` (multipart), 422 en extensión/cabecera inválida
- [x] 5.6 Registrar los 4 routers en `main.py`

## Fase 6: Frontend
- [x] 6.1 Tipos y métodos de API para las 4 entidades en `api/` (incluye `utilidades.ts` para normalizar '' a null)
- [x] 6.2 Store `cuentas.ts` + test Vitest
- [x] 6.3 Store `categorias.ts` (con subcategorías) + test
- [x] 6.4 Store `movimientos.ts` + test (incluye guardia contra respuestas fuera de orden, añadida durante verificación)
- [x] 6.5 `VistaCuentas.vue` (listado + alta/edición/baja)
- [x] 6.6 `VistaCategorias.vue` (jerárquico categoría/subcategoría)
- [x] 6.7 `VistaMovimientos.vue`
- [x] 6.8 `VistaImportarExcel.vue` (subida + resumen)
- [x] 6.9 Rutas nuevas en `router/index.ts` + navegación en `App.vue`

## Fase 7: BDD
- [x] 7.1 Generar `backend/tests/fixtures/movimientos_ejemplo.xlsx` sintético (mismo formato, datos ficticios)
- [x] 7.2 Features en español: `cuenta-bancaria.feature`, `categoria.feature`, `movimiento.feature`, `importacion-excel.feature` (1:1 con las specs)
- [x] 7.3 Step defs correspondientes en `tests/bdd/definiciones_pasos/`

## Fase 8: E2E (con capturas)
- [x] 8.1 `frontend/e2e/capturas/.gitkeep`; capturas se guardan ahí, no se commitean (gitignore), se suben como artefacto de CI
- [x] 8.2 `e2e/cuentas.spec.ts`: alta/edición/baja + captura tras cada paso
- [x] 8.3 `e2e/categorias.spec.ts`: categoría + subcategoría + capturas
- [x] 8.4 `e2e/movimientos.spec.ts` + capturas
- [x] 8.5 `e2e/importar-excel.spec.ts` con el fixture sintético, valida resumen en pantalla + capturas (incluye caso de extensión no soportada)

## Fase 9: Verificación final
- [x] 9.1 `ruff`, `bandit`, `lint-imports` en verde
- [x] 9.2 `pytest --cov` ≥80% (95% real)
- [x] 9.3 `eslint`, `vue-tsc`, `vitest`, `build` en verde
- [x] 9.4 `playwright test` en verde (7/7, contra la pila Docker real)
- [x] 9.5 `sdd-verify` contra las 4 specs

## Añadido durante la implementación (no estaba en el desglose original)

- [x] Proxy Nginx (`nginx.conf`) y proxy de Vite (`vite.config.ts`) para que el
      frontend pueda alcanzar al backend en Docker/CI (gap real del diseño).
- [x] Healthcheck del backend en `docker-compose.yml` para que el frontend
      espere a que esté realmente listo (evita una condición de carrera).
