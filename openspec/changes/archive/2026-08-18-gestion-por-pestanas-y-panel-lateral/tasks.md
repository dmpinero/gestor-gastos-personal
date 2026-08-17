# Tasks: Navegación por pestañas, panel de edición deslizante y barra de estado

## Phase 1: Componentes shadcn-vue base nuevos

- [x] 1.1 Crear `frontend/src/componentes/ui/tabs/` (Tabs, TabsList, TabsTrigger, TabsContent, index.ts).
- [x] 1.2 Crear `frontend/src/componentes/ui/checkbox/` (Checkbox, index.ts).
- [x] 1.3 Crear `frontend/src/componentes/ui/dialog/` (DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, index.ts).
- [x] 1.4 `pnpm add marked` en `frontend/`.
- [x] 1.5 `npx vue-tsc --noEmit` para validar los 3 componentes nuevos antes de seguir.

## Phase 2: Reestructuración de rutas y navegación

- [x] 2.1 Reescribir `frontend/src/router/index.ts`: rutas hijas bajo `/gestion` (redirect a `/gestion/cuentas`).
- [x] 2.2 Crear `frontend/src/vistas/VistaGestion.vue` con `Tabs` sincronizadas con la ruta activa + `RouterView` anidado.
- [x] 2.3 Actualizar `frontend/src/componentes/layout/BarraLateral.vue`: 2 secciones (Inicio, Gestión), activa por prefijo de ruta.
- [x] 2.4 Verificación manual en `pnpm dev`: cambiar de pestaña carga datos reales; recargar mantiene la pestaña.

## Phase 3: Barra de estado y changelog

- [x] 3.1 Copiar el `CHANGELOG.md` actual a `frontend/public/CHANGELOG.md`.
- [x] 3.2 Añadir `define(__VERSION_APP__)` en `frontend/vite.config.ts` y declaración ambiental en `frontend/env.d.ts`.
- [x] 3.3 Test Vitest `frontend/src/componentes/layout/__tests__/ModalChangelog.spec.ts` (fetch OK muestra contenido; fetch fallido muestra error).
- [x] 3.4 Implementar `frontend/src/componentes/layout/ModalChangelog.vue` hasta pasar 3.3.
- [x] 3.5 Crear `frontend/src/componentes/layout/BarraEstado.vue` (versión + botón que abre `ModalChangelog`).
- [x] 3.6 Añadir `BarraEstado` en `frontend/src/App.vue`, con padding inferior en el contenido.
- [x] 3.7 Actualizar `.releaserc.json`: `@semantic-release/npm` (`npmPublish:false`, `pkgRoot:"frontend"`), `@semantic-release/exec` (copia del changelog), nuevos `assets` en `@semantic-release/git`. Añadir devDependencies en `package.json` raíz.

## Phase 4: Panel deslizante de creación/edición — `VistaCuentas.vue`

- [x] 4.1 Mover el formulario a un `Sheet`/`SheetContent`, con botón "Crear cuenta" como disparador vacío y "Editar" de fila como disparador relleno.
- [x] 4.2 Verificar que cerrar el `Sheet` sin guardar no envía peticiones ni modifica el listado.

## Phase 5: Panel deslizante de creación/edición — `VistaMovimientos.vue`

- [x] 5.1 Igual que 4.1/4.2 para Movimientos (incluye los `Select` de Cuenta/Categoría/Subcategoría dentro del `Sheet`).

## Phase 6: Panel deslizante de creación/edición — `VistaCategorias.vue`

- [x] 6.1 La categoría (crear/editar nombre) pasa por `Sheet`; la subcategoría mantiene su mini-formulario inline dentro de la tarjeta.
- [x] 6.2 Restyle visual de las tarjetas (sin selección múltiple).

## Phase 7: Selección múltiple y eliminación en bloque

- [x] 7.1 `VistaCuentas.vue`: columna de `Checkbox` por fila + "seleccionar todo" en cabecera; barra de acción en bloque con `DialogoConfirmarEliminacion`.
- [x] 7.2 `VistaMovimientos.vue`: igual que 7.1.
- [x] 7.3 Botones "Editar"/"Eliminar" de fila a icon-only (`Pencil`/`Trash2`) con `aria-label` igual al texto anterior, en Cuentas y Movimientos.

## Phase 8: Tests E2E y capturas

- [x] 8.1 Actualizar `frontend/e2e/{cuentas,categorias,movimientos,importar-excel}.spec.ts` y `layout.spec.ts`/`accesibilidad.spec.ts`: rutas `/gestion/...`.
- [x] 8.2 Añadir escenario de cambio de pestaña con datos cargados y persistencia de pestaña tras recargar.
- [x] 8.3 Añadir escenario de apertura/cierre del `Sheet` sin guardar.
- [x] 8.4 Añadir escenario de selección múltiple + eliminación en bloque (confirmar y cancelar).
- [x] 8.5 Añadir escenario de apertura de la modal de changelog con capturas.

## Phase 9: Verificación final

- [x] 9.1 `pnpm lint` (oxlint + eslint).
- [x] 9.2 `pnpm test:unit`.
- [x] 9.3 `pnpm build`.
- [x] 9.4 `docker compose up -d --build` + `pnpm test:e2e --project=chromium` contra esa pila.
- [x] 9.5 `sdd-verify` contra la spec `interfaz` (delta).
- [x] 9.6 `sdd-archive` del cambio `gestion-por-pestanas-y-panel-lateral`.
