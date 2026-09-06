# Design: Filtrar movimientos por origen PDF

## Technical Approach

Filtro client-side, igual patrón que fecha/importe/saldo/categoría en
`VistaMovimientos.vue`: no requiere backend porque el listado ya se carga
completo por cuenta y todos los filtros avanzados se aplican en memoria sobre
`tiendaMovimientos.movimientos`.

## Architecture Decisions

### Decision: Filtro en cliente, no en la API

**Choice**: nuevo `ref('soloOrigenPdf')` evaluado dentro del `computed`
`filasConFiltrosAvanzados` ya existente.
**Alternativas consideradas**: añadir `origen` como query param al backend
(`GET /movimientos`).
**Rationale**: ningún otro filtro avanzado de esta vista toca el backend hoy
(el endpoint solo admite `cuenta_id`/`categoria_id`/`subcategoria_id`
exclusivos); mantener la consistencia con el patrón dominante evita mezclar
dos estrategias de filtrado en la misma vista.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/vistas/VistaMovimientos.vue` | Modify | `soloOrigenPdf` ref, condición en `filasConFiltrosAvanzados`, reset en `limpiarFiltros`, entrada en el `watch` de paginación, checkbox en la barra de filtros |
| `frontend/e2e/movimientos.spec.ts` | Modify | Caso: movimientos creados a mano quedan ocultos al marcar el filtro |
| `frontend/e2e/importar-excel.spec.ts` | Modify | Caso: movimientos reales importados desde PDF pasan el filtro |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| E2E | Filtro combinado con datos creados a mano (caso negativo) | Extensión del test de filtros combinados en `movimientos.spec.ts` |
| E2E | Filtro con datos reales de origen PDF (caso positivo) | Extensión del test de importación PDF en `importar-excel.spec.ts` |

## Migration / Rollout

No migration required.
