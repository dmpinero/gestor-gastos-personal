# Proposal: Reorganizar el menú lateral (Backup, Movimientos independiente, Gestión de conceptos en Gestión)

## Intent

El menú lateral agrupa hoy "Gestión de conceptos" bajo Administración, aunque
conceptualmente pertenece a la gestión de categorías/movimientos. Además,
"Movimientos" está enterrado como pestaña de Gestión pese a ser una de las
tareas más frecuentes, y "Administración" ya no refleja bien su contenido una
vez que solo quedan las dos operaciones de copia de seguridad. El usuario pide
reorganizar la disposición para que el menú refleje mejor el uso real.

## Scope

### In Scope
- Mover "Gestión de conceptos" de Administración a Gestión (nueva pestaña/ruta).
- Renombrar por completo Administración → Backup (menú, URL `/administracion`
  → `/backup`, componente `VistaAdministracion.vue` → `VistaBackup.vue`,
  nombres de ruta, fichero E2E `administracion.spec.ts` → `backup.spec.ts`),
  quedando con 2 subsecciones: Realizar backup, Importar backup.
- Convertir "Movimientos" en ítem de menú de primer nivel independiente (ruta
  top-level, ya no bajo `/gestion`), justo debajo de Dashboard.
- Reordenar los ítems de primer nivel: Dashboard, Movimientos, Importar,
  Historial, Resumen anual, Gestión, Backup.
- Actualizar `useTourGuiado.ts` (nueva sección de orientación "movimientos",
  sección "backup" en vez de "administracion", texto de "gestion" actualizado).
- Actualizar la spec `manual-usuario` (delta: requisitos de orientación y de
  tours de Administración/Backup, y el escenario que menciona "Gestión →
  Movimientos").
- Actualizar todos los tests unitarios y E2E afectados por rutas/textos.

### Out of Scope
- Cambios de backend (0% backend).
- Cambios de comportamiento dentro de cada página movida (Gestión de
  conceptos, Realizar backup, Importar backup, Movimientos mantienen su
  funcionalidad interna intacta).
- Nuevos tours o pasos de tour más allá de ajustar la orientación por sección.

## Approach

Cambio estructural de routing + menú: mover la ruta hija `gestion-conceptos`
de `/administracion` a `/gestion`; extraer `movimientos` de hijo de `/gestion`
a ruta de primer nivel `/movimientos`; renombrar el árbol de Administración a
Backup (fichero, ruta, nombres). Reordenar los bloques del `<SidebarMenu>` en
`BarraLateral.vue`. Sincronizar `useTourGuiado.ts` y la spec `manual-usuario`
con la nueva topología. 100% frontend; TDD con Vitest + verificación E2E con
Playwright, igual que el resto de cambios frontend de esta sesión.

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `frontend/src/router/index.ts` | Modified | Nueva ruta top-level `/movimientos`, `gestion-conceptos` bajo `/gestion`, `/administracion`→`/backup` |
| `frontend/src/vistas/VistaGestion.vue` | Modified | Pestañas: Cuentas, Categorías, Gestión de conceptos (sin Movimientos) |
| `frontend/src/vistas/VistaAdministracion.vue` → `VistaBackup.vue` | Renamed/Modified | Solo Realizar backup, Importar backup; `<h2>Backup</h2>` |
| `frontend/src/componentes/layout/BarraLateral.vue` | Modified | Nuevo ítem de primer nivel Movimientos, reorden, subsecciones actualizadas |
| `frontend/src/composables/useTourGuiado.ts` | Modified | Sección "movimientos" nueva, "administracion"→"backup", textos actualizados |
| `openspec/specs/manual-usuario/spec.md` | Modified (delta) | Requisitos de orientación y de tours de Backup |
| Tests unitarios (`VistaMovimientos`, `VistaGestionConceptos`, `VistaRealizarBackup`, `VistaImportarBackup`, `VistaCuentas`, `VistaCategorias`, `useTourGuiado`) | Modified | `data-tour` de orientación esperado, `name` de ruta mockeado |
| `frontend/e2e/administracion.spec.ts` → `backup.spec.ts`, `gestion-conceptos.spec.ts`, `layout.spec.ts`, `manual-usuario-paginas.spec.ts`, `historial.spec.ts`, `accesibilidad.spec.ts`, `movimientos.spec.ts`, `categorias.spec.ts`, `cuentas.spec.ts` | Modified | Rutas y textos hardcodeados actualizados |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Alta superficie de cambio en tests (>30 referencias a `/gestion/movimientos`, textos "Administración") | High | Actualización sistemática fichero por fichero; ejecutar suite completa (vitest + playwright aislado) antes de verify |
| Romper el mapeo `useTourGuiado.ts` y dejar pasos de orientación apuntando a `data-tour` inexistente | Medium | Test unitario `it.each` de `useTourGuiado.spec.ts` cubre cada ruta→sección; se amplía con los casos nuevos |
| Enlaces/bookmarks a `/administracion/*` dejan de funcionar | Low | Proyecto personal en desarrollo activo, sin usuarios externos con enlaces guardados |

## Rollback Plan

Cambio de estructura de rutas y menú sin migración de datos ni cambios de
backend; revertir el PR (o el commit) restaura el árbol de rutas y el menú
anteriores sin efectos sobre datos persistidos.

## Dependencies

Ninguna dependencia externa nueva.

## Success Criteria

- [ ] El menú lateral muestra el orden: Dashboard, Movimientos, Importar, Historial, Resumen anual, Gestión, Backup.
- [ ] "Gestión de conceptos" es accesible desde Gestión, ya no desde Backup.
- [ ] Backup solo contiene Realizar backup e Importar backup.
- [ ] `/movimientos` funciona como ruta de primer nivel; `/gestion/movimientos` ya no existe.
- [ ] El tour por página resalta la sección correcta del menú para cada ruta reorganizada.
- [ ] `vue-tsc`, `pnpm lint`, `pnpm exec vitest run`, `pnpm build` y Playwright (pila aislada) en verde.
