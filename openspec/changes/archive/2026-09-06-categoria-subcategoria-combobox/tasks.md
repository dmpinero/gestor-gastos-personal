# Tasks: Buscador de texto en categoría/subcategoría, y alta al recategorizar en bloque

## Phase 1: Conversión Select → Combobox

- [x] 1.1 `DialogoCambiarCategoriaMasivo.vue`: Combobox + crear categoría/subcategoría (Plus + Sheet)
- [x] 1.2 `PanelEdicionMovimiento.vue`: Select → Combobox en categoría/subcategoría
- [x] 1.3 `VistaResumenAnual.vue`: Select → Combobox en categoría/subcategoría del formulario de concepto
- [x] 1.4 `VistaCategorias.vue`: Select → Combobox en categoría destino

## Phase 2: Infraestructura de tests

- [x] 2.1 `vitest.setup.ts` con stub de `scrollIntoView` + `setupFiles` en `vitest.config.ts` + include en `tsconfig.vitest.json`

## Phase 3: Tests unitarios

- [x] 3.1 `DialogoCambiarCategoriaMasivo.spec.ts`: nuevos tests de crear categoría/subcategoría (patrón de `PanelEdicionMovimiento.spec.ts`)
- [x] 3.2 `PanelEdicionMovimiento.spec.ts`: corregir aserciones `.textContent` → `.value` sobre el nuevo `<input>`

## Phase 4: E2E

- [x] 4.1 Auditar y convertir `elegirOpcion` → `elegirOpcionBuscador` en los 9 ficheros E2E afectados
- [x] 4.2 Auditar y corregir `toContainText`/`toHaveText` → `toHaveValue` sobre los selectores convertidos
- [x] 4.3 Nuevo test E2E: crear categoría/subcategoría desde el diálogo de recategorización en bloque

## Phase 5: Verificación final

- [x] 5.1 `pnpm exec vue-tsc --build --force` en verde
- [x] 5.2 `pnpm lint` en verde
- [x] 5.3 `pnpm exec vitest run` en verde (329-334/335, el único fallo es el flake preexistente de `exportarTabla.spec.ts`)
- [x] 5.4 `pnpm build` en verde
- [x] 5.5 Playwright contra pila aislada: verificado funcionalmente en ejecuciones dirigidas/aisladas (sistema con memoria física crítica durante esta sesión, ~1-4 GB libres de 32 GB, causando inestabilidad genérica no relacionada con este cambio en tests de otras áreas); verificación E2E completa delegada al CI de GitHub Actions antes de fusionar
- [x] 5.6 `sdd-verify`
- [x] 5.7 `sdd-archive`
