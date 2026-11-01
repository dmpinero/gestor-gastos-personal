# Proposal: Buscador de texto en categoría/subcategoría, y alta al recategorizar en bloque

## Intent

El usuario pidió dos mejoras relacionadas: (1) poder dar de alta una
categoría o subcategoría nueva sin salir del flujo, en cualquier sitio de
la aplicación donde se recategoriza un movimiento; (2) que todos los
selectores de categoría/subcategoría de la aplicación permitan escribir
para filtrar por texto, no solo desplegar una lista. Motivado por el uso
real: con muchas categorías ya creadas, desplazarse por una lista larga es
más lento que escribir.

## Scope

### In Scope
- Sustituir el `Select` (lista desplegable simple) por `Combobox`
  (desplegable con buscador de texto) en los 4 selectores de
  categoría/subcategoría que aún usaban `Select`:
  `DialogoCambiarCategoriaMasivo.vue`, `PanelEdicionMovimiento.vue`,
  `VistaResumenAnual.vue` (formulario de concepto previsto), y
  `VistaCategorias.vue` (categoría destino al mover una subcategoría).
- Añadir "crear categoría"/"crear subcategoría" sin salir del diálogo a
  `DialogoCambiarCategoriaMasivo.vue` (recategorización en bloque), el
  único flujo de recategorización que aún no lo tenía.

### Out of Scope
- `VistaGestionConceptos.vue` ya usa `Combobox` en sus 8 selectores; no se
  toca.
- Selectores que no son de categoría/subcategoría (Cuenta, Tipo,
  Periodicidad, Mes de inicio) permanecen como `Select`.
- Cambios de backend.

## Approach

Reutilizar el patrón ya existente en `VistaGestionConceptos.vue`
(`Combobox`/`ComboboxTrigger`/`ComboboxInput`/`ComboboxContent`/`ComboboxEmpty`/`ComboboxItem`
de `frontend/src/componentes/ui/combobox/`) y el patrón ya existente de
"crear categoría/subcategoría" con botón "+" y `Sheet` mini-formulario
(`PanelEdicionMovimiento.vue`, `VistaResumenAnual.vue`). Ningún patrón
nuevo: se generalizan los dos que ya existían.

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `frontend/src/componentes/compartido/DialogoCambiarCategoriaMasivo.vue` | Modified | Combobox + crear categoría/subcategoría nuevo |
| `frontend/src/componentes/compartido/PanelEdicionMovimiento.vue` | Modified | Combobox (ya tenía crear categoría/subcategoría) |
| `frontend/src/vistas/VistaResumenAnual.vue` | Modified | Combobox (ya tenía crear categoría/subcategoría) |
| `frontend/src/vistas/VistaCategorias.vue` | Modified | Combobox en categoría destino |
| `frontend/vitest.setup.ts` | Created | Stub de `scrollIntoView` (jsdom no lo implementa; Reka Combobox lo necesita) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Los tests existentes que comprobaban el texto del Select con `toContainText` fallan silenciosamente contra el nuevo `<input>` | Alta | Auditoría completa de `toContainText`/`toHaveText` sobre selectores de categoría/subcategoría en unit (Vitest) y E2E (Playwright); corregidos a `.value`/`toHaveValue` |
| El helper de teclado `elegirOpcion` (para Select) ya no aplica a los selectores convertidos | Alta | Ya existía `elegirOpcionBuscador` (patrón ARIA 1.2) para Combobox; se sustituyen las ~90 llamadas afectadas en 9 ficheros E2E |

## Rollback Plan

Cambio aditivo/de sustitución de componente en vistas ya existentes;
revertir el PR no tiene efectos de datos ni de backend.

## Dependencies

Ninguna. Rama creada desde `main` (ya incluye los tours y ajustes de PRs
anteriores).

## Success Criteria

- [ ] Los 4 selectores convertidos permiten escribir para filtrar.
- [ ] El diálogo de recategorizar en bloque permite crear categoría y
      subcategoría nuevas sin cerrarse.
- [ ] `pnpm exec vitest run`, `pnpm exec vue-tsc --build`, `pnpm lint`,
      `pnpm build` en verde.
