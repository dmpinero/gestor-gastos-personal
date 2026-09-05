# Proposal: Filtrar movimientos por origen PDF

## Intent

Los movimientos importados desde PDF ya se distinguen con un icono en los
listados (`IconoOrigenPdf`), pero no había forma de aislarlos para revisar en
bloque la categoría/subcategoría que se les asignó automáticamente al
importar. Se añade un filtro dedicado en la vista de Movimientos.

Nota: este cambio ya se implementó y se fusionó (PR #124, commit `4d7604c`)
sin pasar antes por el flujo SDD; este documento lo formaliza a posteriori,
igual que se hizo con `2026-09-05-historial-pdf-y-rendimiento-exportacion`.

## Scope

### In Scope
- Casilla "Solo importados desde PDF" en la barra de filtros de Movimientos.
- Filtrado 100% en cliente, sobre los movimientos ya cargados por cuenta.
- Se incluye en "Limpiar filtros" y en el reseteo de paginación.

### Out of Scope
- Cambios de backend (no existe filtro de origen en la API).
- Aplicar el mismo filtro en Historial o Resumen anual.

## Approach

Nuevo `ref` `soloOrigenPdf` en `VistaMovimientos.vue`, incorporado a la misma
condición `filasConFiltrosAvanzados` que ya aplica el resto de filtros
avanzados (fecha, importe, saldo, categoría), siguiendo el patrón ya
existente de filtrado client-side.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/vistas/VistaMovimientos.vue` | Modified | Nuevo filtro `soloOrigenPdf` |
| `frontend/e2e/movimientos.spec.ts`, `frontend/e2e/importar-excel.spec.ts` | Modified | Cobertura E2E del filtro |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Confundir "sin resultados" con "filtro roto" si no hay movimientos PDF | Baja | Comportamiento igual al resto de filtros avanzados, ya conocido por el usuario |

## Rollback Plan

Cambio aditivo, sin datos ni migraciones; revertir el PR no tiene efectos secundarios.

## Dependencies

- Depende del campo `origen` en `Movimiento` (ya existente, ver requisito "Marca de origen del movimiento").

## Success Criteria

- [x] El filtro muestra solo movimientos con `origen === 'pdf'` cuando está marcado.
- [x] Se combina correctamente con el resto de filtros y con "Limpiar filtros".
