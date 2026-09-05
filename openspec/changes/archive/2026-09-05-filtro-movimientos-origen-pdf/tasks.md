# Tasks: Filtrar movimientos por origen PDF

## Phase 1: Filtro

- [x] 1.1 `frontend/src/vistas/VistaMovimientos.vue`: añadir `ref` `soloOrigenPdf`
- [x] 1.2 Añadir condición en `filasConFiltrosAvanzados`
- [x] 1.3 Resetear en `limpiarFiltros()` y en el `watch` de reseteo de paginación
- [x] 1.4 Casilla "Solo importados desde PDF" en la barra de filtros

## Phase 2: Tests E2E

- [x] 2.1 `movimientos.spec.ts`: caso negativo (movimientos manuales ocultos al marcar el filtro, reaparecen al desmarcar/"Limpiar filtros")
- [x] 2.2 `importar-excel.spec.ts`: caso positivo (movimientos reales de PDF pasan el filtro)

## Phase 3: Verificación final

- [x] 3.1 `pnpm exec vue-tsc --build --force` en verde
- [x] 3.2 `pnpm lint` en verde
- [x] 3.3 `pnpm exec vitest run` en verde
- [x] 3.4 `pnpm build` en verde
- [x] 3.5 Playwright contra pila aislada (`-p gestor-gastos-e2e`) en verde
- [x] 3.6 PR #124 fusionado y redesplegado
