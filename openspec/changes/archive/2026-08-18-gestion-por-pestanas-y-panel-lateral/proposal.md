# Proposal: Navegación por pestañas, panel de edición deslizante y barra de estado

## Intent

El usuario ha compartido una captura de Docker Desktop como referencia visual
para acercar la aplicación a un lenguaje de dashboard técnico: navegación por
pestañas para las secciones de gestión de datos, edición en un panel lateral
deslizante en vez de un formulario siempre visible, tablas más densas con
selección múltiple, y una barra de estado con la versión de la app y acceso al
historial de cambios. De paso se corrigió (sin cambios de código, solo datos)
una contaminación de la base de datos de desarrollo con filas de tests de
integración del backend, que hacía que el combo de cuentas mostrara valores
extraños.

## Scope

### In Scope
- Fusionar las rutas `/cuentas`, `/categorias`, `/movimientos`, `/importar` en
  pestañas de una única vista `/gestion`; el menú lateral queda con Inicio y
  Gestión.
- Panel deslizante (`Sheet`) para crear/editar en Cuentas y Movimientos (y la
  categoría, no la subcategoría, en Categorías), sustituyendo el formulario
  siempre visible.
- Selección múltiple + eliminar en bloque en las tablas de Cuentas y
  Movimientos; restyle visual (sin selección) de las tarjetas de Categorías.
- Barra de estado fija de ancho completo con versión de la app y botón que
  abre una modal con el `CHANGELOG.md` del repo.
- Sincronización automática de la versión (`frontend/package.json`) y del
  changelog estático (`frontend/public/CHANGELOG.md`) en cada release
  mediante el pipeline de `semantic-release` ya existente.

### Out of Scope
- Cambios de dominio/backend (ninguna entidad ni endpoint nuevo).
- Paginación u ordenación de tablas.
- Autenticación de usuarios.
- Cambiar la estructura padre-hijo de Categorías/Subcategorías.

## Approach

Reestructurar el router de Vue con rutas hijas bajo `/gestion` y una nueva
`VistaGestion.vue` que renderiza `Tabs` (nuevo componente shadcn-vue sobre
Reka UI) sincronizadas con la ruta activa, delegando el contenido a
`<RouterView/>`. Las vistas CRUD mueven su formulario a un `Sheet` ya existente
en el catálogo de componentes. Se añaden `ui/checkbox/` y `ui/dialog/` como
nuevos componentes base. La versión y el changelog se resuelven en build-time
(Vite `define` leyendo `package.json`) y en release-time (nuevo plugin
`@semantic-release/npm` + copia del changelog), sin tocar Docker ni backend.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/router/index.ts` | Modified | Rutas anidadas bajo `/gestion` |
| `frontend/src/vistas/VistaGestion.vue` | New | Pestañas + `RouterView` anidado |
| `frontend/src/componentes/layout/{BarraLateral,BarraEstado,ModalChangelog}.vue` | Modified/New | 2 secciones; barra de estado; modal de changelog |
| `frontend/src/componentes/ui/{tabs,checkbox,dialog}/` | New | Componentes shadcn-vue base |
| `frontend/src/vistas/{VistaCuentas,VistaCategorias,VistaMovimientos}.vue` | Modified | Sheet de edición, selección múltiple |
| `frontend/vite.config.ts`, `frontend/env.d.ts` | Modified | Exposición de la versión en build-time |
| `frontend/public/CHANGELOG.md` | New | Copia estática servida por el frontend |
| `.releaserc.json`, `package.json` (root) | Modified | `@semantic-release/npm` + `@semantic-release/exec` |
| `frontend/e2e/*.spec.ts` | Modified | Rutas `/gestion/...`, nuevos escenarios |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper tests E2E existentes al cambiar rutas | Alta (esperado) | Actualizar todos los `page.goto()` afectados como parte de este mismo cambio |
| Iconos en vez de texto en botones de fila reducen accesibilidad si falta `aria-label` | Media | Mantener el mismo nombre accesible (`aria-label="Editar"`/`"Eliminar"`) que el texto actual |
| Versión mostrada queda en `0.0.0` hasta la próxima release real | Alta (esperado, no es un bug) | Documentarlo; se resuelve solo en el siguiente merge a `main` |

## Rollback Plan

Cambio de UI y de pipeline de release, sin migraciones de datos. Revertir es
descartar la rama o revertir el commit de merge; el pipeline de release vuelve
a su configuración anterior revirtiendo `.releaserc.json`.

## Dependencies

- Nuevas dependencias npm: `marked` (frontend), `@semantic-release/npm` y
  `@semantic-release/exec` (raíz del repo).

## Success Criteria

- [ ] Navegar a `/gestion` muestra las 4 pestañas con datos reales cargados.
- [ ] Crear/editar en Cuentas y Movimientos abre un panel deslizante.
- [ ] Se pueden seleccionar varias filas y eliminarlas en bloque, con confirmación.
- [ ] La barra de estado muestra la versión y abre la modal de changelog con el contenido real de `CHANGELOG.md`.
- [ ] `pnpm lint`, `pnpm test:unit`, `pnpm build` y `pnpm test:e2e` pasan en verde.
- [ ] CI en verde en el PR correspondiente.
