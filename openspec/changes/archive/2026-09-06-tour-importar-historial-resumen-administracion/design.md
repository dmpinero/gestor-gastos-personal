# Design: Tour del manual de usuario — Importar, Historial, Resumen anual, Administración

## Technical Approach

Sin cambios de arquitectura: se reutiliza tal cual el patrón de PR #127
(`useRegistrarTourPagina({ pasos: pasosTour })`, `useTourGuiado.ts` sin
tocar). El único caso con lógica condicional en `pasosTour()` es Historial,
que decide su array de pasos según `ruta.params.id` esté presente o no.

## Architecture Decisions

| Decisión | Alternativas consideradas | Elegido |
|---|---|---|
| Historial: `pasosTour()` con `if (!ruta.params.id) return [...]` | Forzar navegación a una categoría real para poder mostrar siempre el tour completo | Navegar a datos reales de la persona usuaria solo para un tour ya se descartó en PR #127 (requiere llamada al servidor); se mantiene el mismo límite |
| Importar: nuevo `<div data-tour="importar-movimientos">` envolviendo el bloque suelto (192-263) | Añadir `data-tour` a cada sub-elemento por separado | El bloque no tiene contenedor propio hoy; envolverlo entero es el cambio mínimo y da un único paso coherente con "explicar el bloque", tal y como pidió el usuario |
| Backup/Importar backup: 1 solo paso por página | Partir en más pasos (párrafo aparte del botón) | Ambas páginas son de una sola acción; partir el único botón en dos pasos no aporta nada |
| "Mes de inicio" (Resumen anual) y "resumen tras importar" (todas las páginas de importación): solo mencionados en texto | Forzar su aparición (abrir el Sheet, simular una importación) | Mismo límite ya establecido y verificado en PR #127: no abrir diálogos cerrados ni fabricar datos |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/vistas/VistaImportarExcel.vue` | Modify | `data-tour="importar-movimientos"` (nuevo contenedor 192-263), `data-tour="importar-conceptos"` (en el `<section>` existente, línea 265) + `pasosTour()` + registro |
| `frontend/src/vistas/VistaHistorialGastos.vue` | Modify | `data-tour` en título+evolución gastos/ingresos (le falta contenedor propio, igual que Importar), filtros, resultados, tabla + `pasosTour()` condicional + registro |
| `frontend/src/vistas/VistaResumenAnual.vue` | Modify | `data-tour` en los 8 elementos ya identificados + `pasosTour()` + registro |
| `frontend/src/vistas/VistaRealizarBackup.vue` | Modify | `data-tour="backup-accion"` envolviendo párrafo+botón + `pasosTour()` + registro |
| `frontend/src/vistas/VistaImportarBackup.vue` | Modify | `data-tour="importar-backup-accion"` envolviendo el formulario + `pasosTour()` + registro |
| `frontend/src/vistas/VistaGestionConceptos.vue` | Modify | `data-tour` en los 6 elementos ya identificados + `pasosTour()` + registro |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Cada Vista: `pasosTour()` devuelve los selectores/títulos esperados | Vitest, mismo patrón que `VistaCuentas.spec.ts`/`VistaCategorias.spec.ts` (mock de `driver.js` y `vue-router`) |
| Unit | Historial: rama sin `ruta.params.id` (1 paso sin elemento) vs. con `ruta.params.id` (5 pasos) | Dos tests, mock de `useRoute` devolviendo `params: {}` o `params: { id: '1' }` |
| E2E | Recorrido completo de cada uno de los 6 tours sin bloquearse | Playwright, `manual-usuario-paginas.spec.ts`, contra pila aislada |
| E2E | Accesibilidad de al menos un tour nuevo, claro/oscuro | Ampliar `accesibilidad.spec.ts`, reutilizando `esperarPopoverEstable` |

## Migration / Rollout

No migration required.
