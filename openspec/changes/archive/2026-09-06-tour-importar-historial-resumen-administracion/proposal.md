# Proposal: Tour del manual de usuario — Importar, Historial, Resumen anual, Administración

## Intent

Segunda y última entrega para que el manual de usuario interactivo cubra
todas las páginas de la aplicación con el mismo nivel de detalle ya
aplicado a Dashboard/Cuentas/Categorías/Movimientos (PR #127). El usuario
probó esa primera entrega en vista previa y pidió completar el resto:
Importar (explicar por separado sus dos bloques), Historial (con detalle
cuando hay categoría/subcategoría elegida), Resumen anual (todas sus
partes) y las 3 sub-páginas de Administración.

## Scope

### In Scope
- Tour de `/importar` (2 pasos: bloque de movimientos, bloque de conceptos previstos).
- Tour de `/historial` (y sus variantes `/historial/categoria/:id`,
  `/historial/subcategoria/:id`): rama condicional según haya o no una
  categoría/subcategoría elegida.
- Tour de `/resumen-anual` (8 pasos).
- Tours de `/administracion/backup`, `/administracion/importar-backup`,
  `/administracion/gestion-conceptos` (independientes entre sí).

### Out of Scope
- Cambios en la arquitectura de `useTourGuiado.ts` (ya cubre estas rutas).
- Forzar la apertura de diálogos/Sheets cerrados, simular una importación
  real, o navegar a datos reales de la persona usuaria solo para revelar
  un paso (mismo límite ya establecido en el PR #127): ese contenido se
  explica en el texto del popover más cercano.
- Cambios de backend.

## Approach

Mismo patrón que en PR #127: cada Vista se registra con
`useRegistrarTourPagina({ pasos: pasosTour })`. Ninguna de estas 6 páginas
necesita `antesDeIniciar`/`alFinalizar` (a diferencia de Movimientos): no
hay ningún control aquí que dependa de forzar un filtro para aparecer.
Listas que pueden estar vacías con datos reales (conceptos sin asociar,
asociaciones creadas) se omiten solas vía `skipMissingElement`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/vistas/VistaImportarExcel.vue` | Modified | `data-tour` + `pasosTour()` |
| `frontend/src/vistas/VistaHistorialGastos.vue` | Modified | `data-tour` + `pasosTour()` condicional |
| `frontend/src/vistas/VistaResumenAnual.vue` | Modified | `data-tour` + `pasosTour()` |
| `frontend/src/vistas/VistaRealizarBackup.vue` | Modified | `data-tour` + `pasosTour()` |
| `frontend/src/vistas/VistaImportarBackup.vue` | Modified | `data-tour` + `pasosTour()` |
| `frontend/src/vistas/VistaGestionConceptos.vue` | Modified | `data-tour` + `pasosTour()` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Historial sin datos de ejemplo hace el E2E frágil | Media | El test crea su propia categoría/movimiento antes de navegar, como en el resto de la sesión |

## Rollback Plan

Cambio aditivo en vistas ya existentes; revertir el PR no afecta datos ni configuración.

## Dependencies

- Arquitectura de `useTourGuiado.ts` del PR #127 (aún sin fusionar; esta
  rama parte de `feat/tour-por-pagina-dashboard-gestion`, no de `main`).

## Success Criteria

- [ ] Las 6 páginas/rutas tienen tour propio con el detalle acordado.
- [ ] El tour de Historial explica todo el contenido cuando hay una
      categoría/subcategoría elegida, y muestra el mensaje ya existente
      cuando no la hay.
