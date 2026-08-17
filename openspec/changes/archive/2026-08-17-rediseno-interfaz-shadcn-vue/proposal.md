# Proposal: Rediseño de la interfaz con shadcn-vue sobre Reka UI

## Intent

La interfaz actual (Vue 3 + Tailwind v4) es funcional pero mínima: `App.vue` solo tiene
un `<h1>` y un `<nav>` horizontal sin estado activo, las vistas CRUD reimplementan cada
una su propio formulario/tabla inline, no hay confirmación antes de eliminar, no hay
iconos ni modo oscuro, y la carpeta `src/componentes/` está vacía. El usuario quiere una
interfaz de tipo Dashboard profesional: navegación en un panel lateral colapsable,
soporte de tema claro/oscuro, y carga de ficheros por arrastrar y soltar en la
importación de Excel.

## Scope

### In Scope
- Base de diseño: `reka-ui` + capa de componentes `shadcn-vue` (código propio en el
  repo) + `lucide-vue-next` para iconos, integrados en Tailwind v4 CSS-first.
- Sidebar de navegación fijo a la derecha, colapsable a una franja de solo iconos, con
  las 5 secciones existentes (Inicio, Cuentas, Categorías, Movimientos, Importar).
- Barra superior con conmutador de modo claro/oscuro persistido en `localStorage`.
- Confirmación (`AlertDialog`) antes de eliminar cualquier registro.
- Drag & drop de fichero en `VistaImportarExcel`, manteniendo la selección por click.
- Migración de las 4 vistas existentes a los nuevos componentes, preservando textos
  accesibles (placeholders, nombres de botones) usados por los tests E2E.
- Actualización de los tests E2E afectados + nuevas capturas de pantalla del rediseño.

### Out of Scope
- Cualquier cambio en el backend o en sus specs ya archivadas.
- Paginación u ordenación de tablas.
- Autenticación de usuarios.
- Nuevas funcionalidades de negocio (todas las operaciones CRUD ya existentes se
  conservan tal cual, solo cambia su presentación).

## Approach

Adoptar el patrón estándar de shadcn-vue: copiar al repo (`src/componentes/ui/`) el
código fuente de los componentes necesarios (Button, Input, Label, Table, Select,
AlertDialog, Tooltip, Sidebar, Card, Sheet, Separator), construidos sobre las
primitivas headless de Reka UI. El tema claro/oscuro se resuelve con variables CSS
(`:root`/`.dark`) y un composable `useModoOscuro`. El sidebar usa el componente
`Sidebar` de shadcn-vue con `side="right"` y `collapsible="icon"`. El drag & drop se
implementa con un componente propio (`ZonaSoltarFichero.vue`) que conserva el
`<input type="file">` nativo oculto para no romper los tests E2E existentes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/App.vue`, `main.css`, `index.html` | Modified | Nuevo layout con sidebar + barra superior, tokens de tema, script anti-FOUC |
| `frontend/components.json`, `frontend/src/lib/utils.ts` | New | Configuración e infraestructura de shadcn-vue |
| `frontend/src/composables/useModoOscuro.ts` | New | Estado y persistencia del tema |
| `frontend/src/componentes/{ui,layout,compartido,importacion}/` | New | Componentes shadcn-vue copiados + composición propia |
| `frontend/src/vistas/*.vue` (4 vistas) | Modified | Migración a los nuevos componentes |
| `frontend/e2e/*.spec.ts` | Modified/New | Ajuste de selectores, confirmación de borrado, nuevos specs de layout y accesibilidad |
| `frontend/package.json` | Modified | Nuevas dependencias de UI |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| El `<select>` nativo de categoría se referenciaba en E2E por posición (`select.nth(1)`), frágil ante el cambio a `Select` headless | Alta (ya detectado) | Cada `Select` nuevo lleva `Label` propia; los tests se reescriben usando rol/nombre accesible en vez de posición |
| Regresiones de accesibilidad en componentes interactivos nuevos (Select, AlertDialog, Sidebar) | Media | Extender la auditoría axe-core (hoy solo en `/`) a las 5 rutas, en claro y oscuro |
| Integrar shadcn-vue sin `tailwind.config.js` (proyecto usa Tailwind v4 CSS-first) | Media | Definir tokens vía `@theme`/`:root`/`.dark` en `main.css`, sin depender del CLI si no soporta v4 |

## Rollback Plan

Cambio aditivo y de sustitución de UI, sin migraciones de base de datos ni cambios de
API. Revertir consiste en descartar la rama `feature/rediseno-interfaz-shadcn-vue` o el
PR sin fusionar; si ya estuviera fusionado, revertir el commit de merge restaura el
`App.vue` y las vistas anteriores sin efectos secundarios en datos.

## Dependencies

- Nuevos paquetes npm: `reka-ui`, `lucide-vue-next`, `class-variance-authority`,
  `clsx`, `tailwind-merge`, `tw-animate-css`.

## Success Criteria

- [ ] Las 4 vistas funcionan igual que antes (mismas operaciones CRUD) con el nuevo
      aspecto visual.
- [ ] Sidebar derecho colapsa/expande y el tema claro/oscuro persiste tras recargar.
- [ ] Importación de Excel funciona tanto por click como por arrastrar y soltar.
- [ ] `pnpm lint`, `pnpm test:unit`, `pnpm build` y `pnpm test:e2e` pasan en verde.
- [ ] CI (GitHub Actions) en verde en el PR correspondiente.
