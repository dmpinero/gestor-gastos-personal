# Tasks: Manual de usuario interactivo

## Phase 1: Dependencia y estilos base

- [x] 1.1 Añadir `driver.js` a `frontend/package.json` (`pnpm add driver.js`)
- [x] 1.2 Importar `driver.js/dist/driver.css` en `frontend/src/assets/main.css`
- [x] 1.3 Añadir overrides de tema en `main.css` para `.driver-popover`, `.driver-popover-title`, `.driver-popover-description`, `.driver-popover-navigation-btns button` usando `var(--popover)`, `var(--popover-foreground)`, `var(--border)`, `var(--primary)`, `var(--primary-foreground)` (claro y `.dark`)

## Phase 2: Composable del tour (TDD)

- [x] 2.1 RED: `frontend/src/composables/__tests__/useTourGuiado.spec.ts` — verifica que `iniciar()` invoca `driver(...)` (mock del módulo `driver.js`) con 8 pasos, en el orden: nav-dashboard, nav-gestion, nav-importar, nav-historial, nav-resumen-anual, nav-administracion, conmutador-tema, boton-manual-usuario
- [x] 2.2 GREEN: Crear `frontend/src/composables/useTourGuiado.ts` con el array `pasos: DriveStep[]` y `iniciar()` (ver `design.md`)
- [x] 2.3 REFACTOR: Revisar textos de cada paso (español, breves, sin errores). Además: `onPopoverRender` para traducir el `aria-label` del botón de cerrar (hallazgo durante la implementación, ver `verify-report.md`)

## Phase 3: Botón de ayuda (TDD)

- [x] 3.1 RED: `frontend/src/componentes/layout/__tests__/BotonManualUsuario.spec.ts` — verifica `aria-label="Abrir el manual de usuario interactivo"` y que el click llama a `iniciar()` (mock de `useTourGuiado`)
- [x] 3.2 GREEN: Crear `frontend/src/componentes/layout/BotonManualUsuario.vue` (icono `CircleHelp` de `@lucide/vue`, mismo patrón de `Button` que `ConmutadorTema.vue`), con `data-tour="boton-manual-usuario"`

## Phase 4: Integración en el layout

- [x] 4.1 `frontend/src/componentes/layout/BarraSuperior.vue`: añadir `<BotonManualUsuario />` junto a `<ConmutadorTema />`
- [x] 4.2 `frontend/src/componentes/layout/ConmutadorTema.vue`: añadir `data-tour="conmutador-tema"` al `Button`
- [x] 4.3 `frontend/src/componentes/layout/BarraLateral.vue`: añadir `data-tour="nav-dashboard"` al `RouterLink` de Dashboard
- [x] 4.4 Añadir `data-tour="nav-gestion"`, `data-tour="nav-importar"`, `data-tour="nav-historial"`, `data-tour="nav-resumen-anual"`, `data-tour="nav-administracion"` a sus respectivos `RouterLink`

## Phase 5: Tests E2E

- [x] 5.1 Crear `frontend/e2e/manual-usuario.spec.ts`: click en el icono de ayuda muestra el primer paso resaltando `[data-tour="nav-dashboard"]`
- [x] 5.2 Test: pulsar "Siguiente" recorre los 8 pasos en el orden de la spec, terminando en `[data-tour="boton-manual-usuario"]`
- [x] 5.3 Test: pulsar "Anterior" retrocede al paso previo
- [x] 5.4 Test: cerrar con el botón de cerrar oculta el tour
- [x] 5.5 Test: cerrar con Escape oculta el tour igual que el botón
- [x] 5.6 Test: recargar la aplicación no lanza el tour automáticamente
- [x] 5.7 Test: navegación completa por teclado (Tab/Enter/flechas/Escape) sin usar el ratón
- [x] 5.8 Ampliar `frontend/e2e/accesibilidad.spec.ts`: auditoría axe-core con el tour abierto, en modo claro y oscuro, sin violaciones WCAG 2.1 AA

## Phase 6: Verificación final

- [x] 6.1 `pnpm exec vue-tsc --build --force` en verde
- [x] 6.2 `pnpm lint` en verde
- [x] 6.3 `pnpm exec vitest run` (293/293, 1 flake no relacionado confirmado en fichero preexistente) en verde
- [x] 6.4 `pnpm build` en verde
- [x] 6.5 Playwright (`manual-usuario.spec.ts` 7/7, `accesibilidad.spec.ts` 16/16, `layout.spec.ts` 8/8) contra pila aislada (`docker compose -p gestor-gastos-e2e`), nunca contra el stack persistente
- [x] 6.6 `sdd-verify`: ver `verify-report.md`
- [x] 6.7 `sdd-archive`: sincronizar `openspec/specs/manual-usuario/` y mover el cambio a `openspec/changes/archive/`
