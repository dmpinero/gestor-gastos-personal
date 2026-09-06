# Proposal: Tour del manual de usuario específico por página (Dashboard + Gestión)

## Intent

El tour guiado actual recorre siempre las mismas 8 paradas (6 secciones del
menú + tema + ayuda), sin importar en qué página se lanza — es una vista
general de navegación, no una guía de cómo se usa cada página. El usuario
quiere que, al pulsar "Ayuda" desde una página, el tour recorra en
profundidad SUS secciones y funcionalidades, incluyendo controles que solo
aparecen bajo cierto estado (ej. "Mes anterior"/"Mes siguiente" en
Movimientos).

Primera de dos entregas: arquitectura + Dashboard, Cuentas, Categorías,
Movimientos (donde vive el caso que motivó la petición).

## Scope

### In Scope
- Nuevo patrón de registro en `useTourGuiado.ts`: cada página aporta sus
  propios pasos; el tour compone orientación (1 paso, sección activa del
  menú) + pasos de la página + cierre (tema + ayuda, igual que hoy).
- Tours de Dashboard, Cuentas, Categorías, Movimientos.
- En Movimientos: forzar temporalmente `fechaDesde`/`fechaHasta` al mes
  actual para resaltar "Mes anterior"/"Mes siguiente" de verdad, y
  restaurarlos al cerrar el tour.
- En Cuentas/Categorías/Movimientos: forzar la selección de la primera fila
  para resaltar la barra de acciones en bloque, y restaurarla al cerrar.

### Out of Scope
- Importar, Historial, Resumen anual, Administración (cambio 2, aparte).
- Navegar automáticamente entre pestañas de Gestión/Administración.
- Forzar contenido que requiera abrir diálogos, importar ficheros reales, o
  navegar a datos reales del usuario (se explica en el popover, sin resaltar).
- Cambios de backend.

## Approach

Patrón "proveedor de tour por página": cada Vista se registra vía
`useRegistrarTourPagina({ pasos, antesDeIniciar?, alFinalizar? })` en su
`<script setup>`. `useTourGuiado().iniciar()` lee la ruta activa
(`useRoute()`), resalta el `data-tour="nav-..."` correspondiente
(ya existentes en `BarraLateral.vue`), pide los pasos al proveedor
registrado y añade el cierre. `onDestroyStarted` de Driver.js dispara
`alFinalizar` para restaurar cualquier estado forzado, cierre por el motivo
que sea (botón, Escape, fin del recorrido).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/composables/useTourGuiado.ts` | Modified | Registro por página, orientación, cierre |
| `frontend/src/vistas/VistaInicio.vue` | Modified | `data-tour` + `pasosTour()` |
| `frontend/src/vistas/VistaCuentas.vue` | Modified | `data-tour` + `pasosTour()` + forzar selección |
| `frontend/src/vistas/VistaCategorias.vue` | Modified | `data-tour` + `pasosTour()` + forzar selección/expansión |
| `frontend/src/vistas/VistaMovimientos.vue` | Modified | `data-tour` + `pasosTour()` + forzar fechas/selección |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Forzar fechas cambia momentáneamente la tabla visible | Media | Restaurar siempre al cerrar (cualquier vía), test E2E dedicado |
| Elemento no disponible al iniciar (datos aún cargando) | Baja | `skipMissingElement: true` + paso de fallback en Dashboard |

## Rollback Plan

Cambio de comportamiento en una función existente y aditivo en las vistas;
revertir el PR no afecta datos ni configuración.

## Dependencies

- `openspec/specs/manual-usuario/spec.md` (MODIFICA el requisito "Recorrido
  de las secciones principales").

## Success Criteria

- [ ] El tour en Dashboard/Cuentas/Categorías/Movimientos recorre esa página,
      no las 6 secciones del menú.
- [ ] "Mes anterior"/"Mes siguiente" se resaltan de verdad durante el tour en
      Movimientos, y el filtro de fechas queda igual que antes al cerrarlo.
