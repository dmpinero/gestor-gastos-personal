# Design: Buscador de texto en categoría/subcategoría, y alta al recategorizar en bloque

## Technical Approach

Sin arquitectura nueva: se generalizan dos patrones ya existentes en el
código. (1) `Combobox` de `frontend/src/componentes/ui/combobox/` (Reka
UI), ya usado en `VistaGestionConceptos.vue`. (2) "Crear
categoría/subcategoría" con botón `Plus` + `Sheet` mini-formulario, ya
usado en `PanelEdicionMovimiento.vue`/`VistaResumenAnual.vue`. Todos los
selectores afectados ya usaban un proxy `computed<string>` (texto↔número)
para el v-model, reutilizado sin cambios: solo cambian los componentes de
plantilla.

## Architecture Decisions

| Decisión | Alternativas consideradas | Elegido |
|---|---|---|
| `mostrarCategoria(valor)`/`mostrarSubcategoria(valor)` como `:display-value`, reutilizando o adaptando la función `nombreCategoria`/`nombreSubcategoria` ya existente en cada fichero | Una función compartida en un composable | Cada Vista ya tenía su propia función local (o un `computed` similar); una función compartida no aportaba frente a 4 adaptadores de una línea |
| `VistaCategorias.vue` (mover subcategoría): solo Combobox, sin "crear nueva" | Añadir también "crear categoría" ahí | No es un flujo de recategorizar movimientos (fuera del alcance pedido), y la página ya tiene su propio botón "Crear categoría" en la cabecera |
| Stub global `Element.prototype.scrollIntoView` en `vitest.setup.ts` | Stub por fichero de test | jsdom no implementa `scrollIntoView`; Reka Combobox lo llama al resaltar la opción elegida incluso fijando el valor por proxy (sin abrir el desplegable). Afecta a los 4 ficheros de test convertidos; un stub global evita repetirlo |
| Auditoría manual de `toContainText`/`toHaveText` → `.value`/`toHaveValue` sobre selectores convertidos, en vez de un blanket-replace | Sed global sin revisar | `toContainText` en un elemento no-input (p. ej. el título de un Sheet) sigue siendo correcto; solo los que apuntan al propio combobox (antes el trigger del Select, ahora el `<input>`) necesitaban el cambio |

## File Changes

| File | Action | Description |
|------|--------|--------------|
| `frontend/src/componentes/compartido/DialogoCambiarCategoriaMasivo.vue` | Modify | Combobox + crear categoría/subcategoría (patrón de `PanelEdicionMovimiento.vue`) |
| `frontend/src/componentes/compartido/PanelEdicionMovimiento.vue` | Modify | Select → Combobox en categoría/subcategoría |
| `frontend/src/vistas/VistaResumenAnual.vue` | Modify | Select → Combobox en categoría/subcategoría del formulario de concepto |
| `frontend/src/vistas/VistaCategorias.vue` | Modify | Select → Combobox en categoría destino |
| `frontend/vitest.setup.ts` | Create | Stub `scrollIntoView` |
| `frontend/vitest.config.ts` | Modify | `setupFiles` |
| `frontend/tsconfig.vitest.json` | Modify | Incluir `vitest.setup.ts` |
| `frontend/e2e/*.spec.ts` (9 ficheros) | Modify | `elegirOpcion` → `elegirOpcionBuscador` en los selectores convertidos |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Cada componente/vista: proxies de selección, crear categoría/subcategoría | Vitest, mismo patrón que ya existía (`defineExpose` de los proxies en `DialogoCambiarCategoriaMasivo.spec.ts`, DOM real en `PanelEdicionMovimiento.spec.ts`) |
| E2E | Interacción real con el Combobox (escribir, resaltar, Enter) | Playwright, helper ya existente `elegirOpcionBuscador` |
| E2E | Crear categoría/subcategoría desde el diálogo de recategorización en bloque | Nuevo test en `movimientos.spec.ts`, mismo patrón que el ya existente para `PanelEdicionMovimiento.vue` |

## Migration / Rollout

No migration required.
