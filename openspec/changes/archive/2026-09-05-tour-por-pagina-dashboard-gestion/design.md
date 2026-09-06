# Design: Tour del manual de usuario específico por página (Dashboard + Gestión)

## Technical Approach

`useTourGuiado.ts` pasa de tener un array de pasos estático a componer los
pasos en el momento de pulsar "Ayuda": 1 paso de orientación (según la ruta
activa) + los pasos que registre la página actualmente montada + 2 pasos de
cierre (tema, ayuda). Cada Vista se registra a sí misma con un composable
nuevo, evitando que `useTourGuiado.ts` conozca los detalles internos de cada
página.

## Architecture Decisions

| Decisión | Alternativas consideradas | Elegido |
|---|---|---|
| Registro por página vía composable (`useRegistrarTourPagina`) llamado desde cada Vista | (a) `useTourGuiado.ts` importa y llama directamente a una función por Vista (acopla el composable a cada página); (b) Pinia store para el tour | Registro: cada Vista ya usa el patrón `useRoute()`+lógica local (`BarraLateral.vue:39`, `VistaGestion.vue:6`); no hay estado compartido entre páginas (una Vista desmontada no debe dejar rastro), así que un `ref` de módulo con `onMounted`/`onUnmounted` basta, sin Pinia |
| Orientación: 1 paso fijo por grupo de ruta, mapa `nombreRuta → data-tour` | Resaltar directamente el link de la sub-ruta activa (no existe hoy un `data-tour` por pestaña) | Mapa simple `Record<string, string>`, reutiliza los `data-tour="nav-..."` ya existentes en `BarraLateral.vue` |
| Forzar/restaurar estado con `antesDeIniciar`/`alFinalizar` provistos por la propia Vista | Que `useTourGuiado.ts` mute refs de la Vista desde fuera (rompe encapsulación) | Cada Vista controla su propio estado; el composable solo orquesta cuándo llamarlos |
| Restauración en `onDestroyStarted` (Driver.js) | Restaurar solo al llegar al último paso | `onDestroyStarted` se dispara para cualquier vía de cierre (botón, Escape, fin del recorrido), es el único punto que cubre todos los casos |
| `skipMissingElement: true` global + paso de fallback en Dashboard si `tienda.resumen` es `null` | Esperar de forma asíncrona a que carguen los datos antes de construir los pasos | Evita complejidad asíncrona en `iniciar()` (síncrona hoy); en la práctica el usuario pulsa "Ayuda" bastante después de que la página cargue |

## Data Flow

    BotonManualUsuario.vue
        └─ useTourGuiado().iniciar()
              ├─ pasoOrientacionPara(ruta.name) ─────────────┐
              ├─ proveedorActual.value?.antesDeIniciar?.()   │
              ├─ proveedorActual.value?.pasos() ─────────────┤─► driver({ steps: [...], onDestroyStarted }).drive()
              └─ pasosCierre (tema, ayuda) ───────────────────┘
                                                                     │
    VistaMovimientos.vue (montada)                                  │
        └─ useRegistrarTourPagina({ pasos: pasosTour,               │
             antesDeIniciar: forzarMesCompleto,                     │
             alFinalizar: restaurarFechas })  ◄──────── onDestroyStarted
              (onMounted: se registra / onUnmounted: se desregistra)

## Interfaces

```ts
// frontend/src/composables/useTourGuiado.ts
export interface ProveedorTourPagina {
  pasos: () => DriveStep[]
  antesDeIniciar?: () => void
  alFinalizar?: () => void
}
export function useRegistrarTourPagina(proveedor: ProveedorTourPagina): void
export function useTourGuiado(): { iniciar: () => void }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/composables/useTourGuiado.ts` | Modify | Registro por página, orientación, cierre, restauración |
| `frontend/src/composables/__tests__/useTourGuiado.spec.ts` | Modify | Tests del nuevo comportamiento |
| `frontend/src/vistas/VistaInicio.vue` | Modify | `data-tour` en tarjetas/bloques + `pasosTour()` + registro |
| `frontend/src/vistas/VistaCuentas.vue` | Modify | `data-tour` + `pasosTour()` + forzar selección de la primera fila |
| `frontend/src/vistas/VistaCategorias.vue` | Modify | `data-tour` + `pasosTour()` + forzar selección/expandir primera categoría |
| `frontend/src/vistas/VistaMovimientos.vue` | Modify | `data-tour` + `pasosTour()` + forzar fechas (mes completo) y selección |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useTourGuiado`: orientación correcta por ruta, composición orientación+página+cierre, `alFinalizar` se llama al destruir | Vitest, mock de `driver.js` (patrón ya usado) y de `vue-router` (`useRoute`) |
| Unit | Cada Vista: `pasosTour()` devuelve selectores/títulos/descripciones esperados; `antesDeIniciar`/`alFinalizar` mutan y restauran el estado correcto | Vitest, `mount()` con Pinia de test |
| E2E | Tour completo por página, orientación correcta, "Mes anterior/siguiente" resaltados y filtro restaurado al cerrar | Playwright, nuevo `manual-usuario-paginas.spec.ts` |

## Migration / Rollout

No migration required. El tour existente (`manual-usuario.spec.ts`) deja de
ser válido tal cual (ya no recorre las 6 secciones desde cualquier página);
se actualiza junto con este cambio.
