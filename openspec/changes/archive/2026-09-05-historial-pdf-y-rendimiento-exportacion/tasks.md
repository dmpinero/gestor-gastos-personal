# Tasks: Historial coherente, importación PDF y límite de exportación

Retroactivo: todas las tareas se completaron ya en los PR #117, #118, #119 y
#121 (fusionados).

## Phase 1: Historial usa asociaciones

- [x] 1.1 Generalizar `resolver_categoria_movimiento_real` para aceptar `categoria_id`/`subcategoria_id` sueltos
- [x] 1.2 Añadir `listar_por_descripcion` (sin acotar mes) a `RepositorioMovimientos`
- [x] 1.3 Nuevo caso de uso `ListarMovimientosPorCategoriaResumen`
- [x] 1.4 Nuevo endpoint `GET /previsiones/movimientos-por-categoria`
- [x] 1.5 `stores/movimientos.ts` y `VistaHistorialGastos.vue` usan el nuevo endpoint
- [x] 1.6 Tests unitarios del caso de uso (fragmento solapado, resolución vía asociación de concepto)
- [x] 1.7 Test E2E "Amazon Prime" (subcategoría solo localizable por asociación de descripción)

## Phase 2: Importación desde PDF

- [x] 2.1 `LectorPdf` (dominio) + `FilaMovimientoPdf`/`DatosPdfLeidos`
- [x] 2.2 `LectorPdfIng` (infraestructura, `pdfplumber`)
- [x] 2.3 `ImportarMovimientosPdf`: resolución por asociación + fallback "Sin categorizar"
- [x] 2.4 Router `POST /movimientos/importar` elige caso de uso por extensión
- [x] 2.5 Frontend: texto de la zona de subida admite también `.pdf`
- [x] 2.6 Fixtures PDF sintéticos (`movimientos_ejemplo.pdf` y variantes de error)
- [x] 2.7 Tests unitarios del lector y del caso de uso
- [x] 2.8 Test E2E de importación de PDF de extremo a extremo

## Phase 3: Marca de origen

- [x] 3.1 Campo `origen` en `Movimiento` + migración Alembic
- [x] 3.2 `ImportarMovimientosPdf` marca `origen="pdf"`; `actualizar()` no lo toca
- [x] 3.3 Componente `IconoOrigenPdf.vue`
- [x] 3.4 Icono integrado en `VistaMovimientos.vue`, `VistaHistorialGastos.vue`, `TablaMovimientosAgrupada.vue`
- [x] 3.5 Test de integración: `origen` persiste y sobrevive a `actualizar()`
- [x] 3.6 Test unitario del componente + aserciones E2E del icono

## Phase 4: Corrección de duplicados por espaciado

- [x] 4.1 `buscar_duplicado` normaliza espacios en la descripción antes de comparar
- [x] 4.2 Test de integración con descripción de doble espacio

## Phase 5: Límite de años en exportación

- [x] 5.1 `Query(ge=2018, le=año_actual+1)` en `anio_desde`/`anio_hasta`
- [x] 5.2 Tests: rechazo por debajo/por encima del límite, rango completo permitido
- [x] 5.3 Confirmar que el test de contrato del endpoint baja de 15-19 min a segundos

## Phase 6: Verificación final

- [x] 6.1 `ruff`, `ruff format`, `lint-imports`, `bandit` en verde
- [x] 6.2 `pytest` completo del backend en verde (359-380 tests según rama)
- [x] 6.3 `vue-tsc`, `pnpm lint`, `pnpm build` en verde
- [x] 6.4 E2E Playwright contra pila aislada (`docker compose -p gestor-gastos-e2e`)
- [x] 6.5 CI en verde en los 4 PR, fusionados a `main`
