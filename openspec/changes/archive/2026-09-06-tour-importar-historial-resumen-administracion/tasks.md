# Tasks: Tour del manual de usuario — Importar, Historial, Resumen anual, Administración

## Phase 1: Importar (TDD)

- [x] 1.1 RED: `VistaImportarExcel.spec.ts` — `pasosTour()` incluye `importar-movimientos` e `importar-conceptos`
- [x] 1.2 GREEN: nuevo `<div data-tour="importar-movimientos">` (192-263), `data-tour="importar-conceptos"` en el `<section>` existente (265) + `pasosTour()` + registro

## Phase 2: Historial (TDD)

- [x] 2.1 RED: `VistaHistorialGastos.spec.ts` — sin `ruta.params.id`, `pasosTour()` devuelve 1 paso sin elemento
- [x] 2.2 RED: con `ruta.params.id`, `pasosTour()` incluye evolución de gastos/ingresos, filtros, resultados, tabla
- [x] 2.3 GREEN: `data-tour` + `pasosTour()` condicional + registro

## Phase 3: Resumen anual (TDD)

- [x] 3.1 RED: `VistaResumenAnual.spec.ts` — `pasosTour()` incluye los 8 pasos en orden
- [x] 3.2 GREEN: `data-tour` en los 8 elementos + `pasosTour()` + registro

## Phase 4: Administración (TDD)

- [x] 4.1 RED: `VistaRealizarBackup.spec.ts` — `pasosTour()` incluye `backup-accion`
- [x] 4.2 GREEN: `data-tour` + `pasosTour()` + registro
- [x] 4.3 RED: `VistaImportarBackup.spec.ts` — `pasosTour()` incluye `importar-backup-accion`, popover menciona que es destructivo
- [x] 4.4 GREEN: `data-tour` + `pasosTour()` + registro
- [x] 4.5 RED: `VistaGestionConceptos.spec.ts` — `pasosTour()` incluye los 6 pasos en orden
- [x] 4.6 GREEN: `data-tour` + `pasosTour()` + registro

## Phase 5: E2E

- [x] 5.1 Ampliar `frontend/e2e/manual-usuario-paginas.spec.ts`: Importar, Historial (con categoría creada de antemano), Resumen anual, y las 3 de Administración — orientación correcta, recorrido completo sin bloquearse
- [x] 5.2 Ampliar `frontend/e2e/accesibilidad.spec.ts` con al menos uno de los tours nuevos (Resumen anual), claro y oscuro

## Phase 6: Verificación final

- [x] 6.1 `pnpm exec vue-tsc --build --force` en verde
- [x] 6.2 `pnpm lint` en verde
- [x] 6.3 `pnpm exec vitest run` en verde (1 fallo confirmado como el flake preexistente de `exportarTabla.spec.ts`, ya documentado; pasa aislado)
- [x] 6.4 `pnpm build` en verde
- [x] 6.5 Playwright contra pila aislada (`-p gestor-gastos-e2e`) en verde (1 fallo confirmado como el flake preexistente de `seleccionarElementosFiltro`, ya documentado, en un test no modificado esta sesión; pasa en reintentos aislados)
- [x] 6.6 `sdd-verify`
- [x] 6.7 `sdd-archive`
