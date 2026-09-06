# Verify Report: Tour del manual de usuario — Importar, Historial, Resumen anual, Administración

**Change**: tour-importar-historial-resumen-administracion
**Version**: N/A

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 21 |
| Tasks complete | 21 |
| Tasks incomplete | 0 |

Todas las fases (1-6) completas: Importar, Historial, Resumen anual, Administración (3 subvistas), E2E, verificación final.

---

## Build & Tests Execution

**Build**: ✅ Passed (`pnpm build`, vue-tsc + vite build, sin errores)

**Type-check**: ✅ Passed (`pnpm exec vue-tsc --build --force`, sin salida)

**Lint**: ✅ Passed (`pnpm lint`, 0 errores; 3 warnings preexistentes no relacionados en e2e/manual-usuario.spec.ts, e2e/movimientos.spec.ts, e2e/resumen-anual.spec.ts)

**Tests unitarios**: ✅ 324 passed / ❌ 1 failed / 325 total (`pnpm exec vitest run`)
```
Fallo: src/lib/__tests__/exportarTabla.spec.ts > genera un libro de Excel...
Causa: timeout de 5000ms — flake preexistente y ya documentado (no relacionado
con este cambio, ningún fichero de exportación se ha tocado). Confirmado
como flake: pasa 2/2 al reejecutarlo aislado.
```

**E2E Playwright** (pila aislada `-p gestor-gastos-e2e`, `PLAYWRIGHT_BASE_URL`):
- `manual-usuario-paginas.spec.ts`: ✅ 9/9 (3 preexistentes + 6 nuevos: Importar, Historial, Resumen anual, Administración×3)
- `accesibilidad.spec.ts`: ✅ 28/29 en ejecución conjunta; 1 fallo intermitente en el test preexistente "el tour de Movimientos... modo oscuro" (NO modificado esta sesión) por contraste en `.hover:bg-destructive/90` — confirmado como flake preexistente (2/3 fallos, 1/3 éxito al repetir 3 veces de forma aislada; no relacionado con ningún fichero tocado en este cambio)

Durante la verificación se encontró y corrigió un bug real en el propio test de Historial (no en el producto): navegar a `/historial` antes de pulsar "Expandir Historial" deja el desplegable ya abierto (`historialActivo('/historial')` es `true`), así que el test se ajustó para no navegar explícitamente y pulsar "Expandir Historial" desde `/gestion/movimientos`, igual que ya hace `historial.spec.ts`.

**Coverage**: ➖ No configurado (`coverage_threshold` no está en `openspec/config.yaml`)

---

## Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Tour de la página Importar | El tour de Importar recorre ambos bloques por separado | `VistaImportarExcel.spec.ts` (unit) + `manual-usuario-paginas.spec.ts > Importar: ...` (e2e) | ✅ COMPLIANT |
| Tour de la página Historial según haya categoría elegida | Historial sin categoría elegida muestra un único paso | `VistaHistorialGastos.spec.ts > sin categoría elegida, el tour muestra un único paso sin elemento` | ✅ COMPLIANT |
| Tour de la página Historial según haya categoría elegida | Historial con una categoría elegida recorre todo su contenido | `VistaHistorialGastos.spec.ts > con una categoría elegida...` (unit) + `manual-usuario-paginas.spec.ts > Historial: ...` (e2e) | ✅ COMPLIANT |
| Tour de la página Resumen anual | El tour de Resumen anual recorre todas sus partes | `VistaResumenAnual.spec.ts` (unit) + `manual-usuario-paginas.spec.ts > Resumen anual: ...` (e2e) + `accesibilidad.spec.ts` (claro/oscuro) | ✅ COMPLIANT |
| Tours de las páginas de Administración | El tour de Gestión de conceptos recorre sus formularios y tablas | `VistaGestionConceptos.spec.ts` (unit) + `manual-usuario-paginas.spec.ts > Administración → Gestión de conceptos: ...` (e2e) | ✅ COMPLIANT |
| Tours de las páginas de Administración | El tour de Importar backup advierte del riesgo | `VistaImportarBackup.spec.ts > ...advierte de que es destructivo` (unit) + `manual-usuario-paginas.spec.ts > Administración → Importar backup: ...` (e2e, comprueba texto "sustituye") | ✅ COMPLIANT |

**Compliance summary**: 6/6 scenarios compliant (la spec define 4 requisitos con 6 escenarios; el requisito de Realizar backup, aunque no tiene un escenario Given/When/Then explícito en la spec, también está cubierto: `VistaRealizarBackup.spec.ts` + e2e).

---

## Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Tour de Importar | ✅ Implementado | `pasosTour()` con 2 pasos; wrapper `<div data-tour="importar-movimientos">` (192-263 original) y `data-tour="importar-conceptos"` en el `<section>` existente |
| Tour de Historial condicional | ✅ Implementado | `pasosTour()` con rama `if (!ruta.params.id)` → 1 paso sin `element`; rama con id → 5 pasos (evolución gastos/ingresos, filtros, resultados, tabla) |
| Tour de Resumen anual | ✅ Implementado | 8 pasos con `data-tour` en importar, exportar, cargar-acumulado, añadir-concepto, año, buscar, agrupar, tablas |
| Tours de Administración | ✅ Implementado | 3 vistas con `pasosTour()` propio; Importar backup menciona explícitamente "sustituye" en el popover |

---

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Sin cambios a `useTourGuiado.ts` | ✅ Yes | Confirmado: `git status` no muestra el fichero modificado; `SECCION_POR_RUTA` ya cubría las 6 rutas desde PR1 |
| Historial: rama condicional según `ruta.params.id` | ✅ Yes | Implementado tal cual en `pasosTour()` |
| Importar: wrapper nuevo en vez de atributos sueltos | ✅ Yes | `<div data-tour="importar-movimientos">` envuelve el bloque 192-263 original |
| Backup/Importar backup: 1 solo paso por página | ✅ Yes | Ambas vistas tienen `pasosTour()` con un único elemento |
| No forzar apertura de diálogos/Sheets, solo mencionar en texto | ✅ Yes | "Mes de inicio" (Resumen anual) y "resumen tras importar" (Importar/Importar backup) solo se mencionan en la descripción del popover, sin `antesDeIniciar`/`alFinalizar` |
| Ninguna de las 6 páginas necesita `antesDeIniciar`/`alFinalizar` | ✅ Yes | Ninguna de las 6 vistas registra esos hooks; confirmado leyendo el código de las 6 |

---

## Issues Found

**CRITICAL** (must fix before archive):
None

**WARNING** (should fix):
None — los 2 fallos observados durante la ejecución de tests son flakes preexistentes, documentados en memoria del proyecto, en ficheros no tocados por este cambio (`exportarTabla.spec.ts`, y el test "tour de Movimientos" en `accesibilidad.spec.ts`), y ambos confirmados como flakes al reejecutarlos de forma aislada.

**SUGGESTION** (nice to have):
None

---

## Verdict

PASS

Los 6 escenarios de la spec están implementados y verificados con evidencia de ejecución real (unit + E2E contra la pila aislada); type-check, lint y build en verde; los 2 únicos fallos vistos en la suite completa son flakes preexistentes ajenos a este cambio.
