# Tasks: Reorganizar el menú lateral (Backup, Movimientos independiente, Gestión de conceptos en Gestión)

## Phase 1: Router y renombrado de ficheros

- [x] 1.1 En `frontend/src/router/index.ts`: añadir ruta top-level `{ path: '/movimientos', name: 'movimientos', component: VistaMovimientos }`.
- [x] 1.2 En `frontend/src/router/index.ts`: añadir hijo `{ path: 'conceptos', name: 'gestion-conceptos', component: VistaGestionConceptos }` al array `children` de `/gestion`; quitar el hijo `movimientos` de ese array.
- [x] 1.3 Renombrar fichero `frontend/src/vistas/VistaAdministracion.vue` → `frontend/src/vistas/VistaBackup.vue`.
- [x] 1.4 En `frontend/src/router/index.ts`: cambiar import a `VistaBackup` desde `./vistas/VistaBackup.vue`; cambiar bloque `/administracion` a `{ path: '/backup', component: VistaBackup, redirect: '/backup/realizar', children: [{ path: 'realizar', name: 'backup-realizar', component: VistaRealizarBackup }, { path: 'importar', name: 'backup-importar', component: VistaImportarBackup }] }`.
- [x] 1.5 En `frontend/src/vistas/VistaBackup.vue`: actualizar `pestanas` a `[{nombre:'backup-realizar', ruta:'/backup/realizar', etiqueta:'Realizar backup'}, {nombre:'backup-importar', ruta:'/backup/importar', etiqueta:'Importar backup'}]`, `PESTANA_POR_DEFECTO='backup-realizar'`, `<h2>Backup</h2>`.
- [x] 1.6 En `frontend/src/vistas/VistaGestion.vue`: quitar entrada `gestion-movimientos` de `pestanas`; añadir `{nombre:'gestion-conceptos', ruta:'/gestion/conceptos', etiqueta:'Asociar conceptos'}` (renombrado tras feedback de usuario, ver Fase 6).

## Phase 2: BarraLateral.vue

- [x] 2.1 Añadir nuevo `<SidebarMenuItem>` simple "Movimientos" (mismo patrón que Dashboard, líneas 158-169): `RouterLink to="/movimientos"`, `data-tour="nav-movimientos"`, icono `ArrowLeftRight` `text-rose-500`, justo después del bloque Dashboard.
- [x] 2.2 Actualizar `subseccionesGestion`: quitar entrada Movimientos; añadir `{a:'/gestion/conceptos', etiqueta:'Asociar conceptos', icono: Link2, color:'text-lime-500'}` (etiqueta y color ajustados en Fase 6).
- [x] 2.3 Renombrar `subseccionesAdministracion` → `subseccionesBackup`, dejando solo `[{a:'/backup/realizar', etiqueta:'Realizar backup', ...}, {a:'/backup/importar', etiqueta:'Importar backup', ...}]`.
- [x] 2.4 Renombrar función `administracionActiva(path)` → `backupActiva(path)` = `path.startsWith('/backup')`.
- [x] 2.5 Renombrar ref `administracionAbierta` → `backupAbierta`; actualizar el `watch` (línea 137) para usar `backupActiva`.
- [x] 2.6 En el bloque `<Collapsible>` de Administración (líneas 335-379): cambiar `to="/administracion"` → `to="/backup"`, `data-tour="nav-administracion"` → `data-tour="nav-backup"`, icono `Database` `text-orange-500` sin cambio, texto `Administración`→`Backup`, tooltip y aria-labels `'Contraer/Expandir Administración'`→`'Contraer/Expandir Backup'`, referencias a `administracionAbierta`/`administracionActiva`/`subseccionesAdministracion` actualizadas a los nuevos nombres.
- [x] 2.7 Reordenar los bloques del template: Dashboard, Movimientos, Importar, Historial, Resumen anual, Gestión (mover el bloque `<Collapsible>` de Gestión, líneas 171-209, a justo antes del bloque de Backup), Backup (último).

## Phase 3: useTourGuiado.ts

- [x] 3.1 Actualizar `type SeccionMenu` a `'dashboard' | 'movimientos' | 'gestion' | 'importar' | 'historial' | 'resumen-anual' | 'backup'`.
- [x] 3.2 Actualizar `SECCION_POR_RUTA`: añadir `movimientos: 'movimientos'`; cambiar `'gestion-movimientos'` por `'gestion-conceptos': 'gestion'`; sustituir las 3 entradas `administracion-*` por `'backup-realizar': 'backup'`, `'backup-importar': 'backup'`.
- [x] 3.3 Añadir entrada `movimientos` en `ORIENTACION_POR_SECCION`: `element:'[data-tour="nav-movimientos"]'`, título "Movimientos", descripción "Registra, edita y filtra tus movimientos de gastos e ingresos.".
- [x] 3.4 Actualizar descripción de `gestion` para mencionar conceptos: "Administra tus cuentas, categorías, y las asociaciones entre conceptos previstos y categorías reales.".
- [x] 3.5 Renombrar entrada `administracion`→`backup`: `element:'[data-tour="nav-backup"]'`, título "Backup", descripción "Realiza copias de seguridad de tus datos o restaura una copia anterior." (sin mención a conceptos).

## Phase 4: Tests unitarios

- [x] 4.1 `VistaRealizarBackup.spec.ts`: mock `useRoute` con `name:'backup-realizar'`; assert `'[data-tour="nav-backup"]'`.
- [x] 4.2 `VistaImportarBackup.spec.ts`: mock `name:'backup-importar'`; assert `'[data-tour="nav-backup"]'`.
- [x] 4.3 `VistaGestionConceptos.spec.ts`: mock `name:'gestion-conceptos'`; assert `'[data-tour="nav-gestion"]'`.
- [x] 4.4 `VistaMovimientos.spec.ts`: mock `name:'movimientos'` (quitar `query:{}` si ya no aplica); assert `'[data-tour="nav-movimientos"]'`.
- [x] 4.5 `useTourGuiado.spec.ts`: en la tabla `it.each`, añadir `['movimientos', '[data-tour="nav-movimientos"]']`, cambiar `'gestion-movimientos'`→ eliminar, `'administracion-gestion-conceptos'`→`['gestion-conceptos', '[data-tour="nav-gestion"]']`, `'administracion-*'`→`['backup-realizar'/'backup-importar', '[data-tour="nav-backup"]']`.

## Phase 5: Tests E2E

- [x] 5.1 Renombrar `frontend/e2e/administracion.spec.ts` → `frontend/e2e/backup.spec.ts`; sustituir textos "Administración"→"Backup", rutas `/administracion/*`→`/backup/*`; eliminar aserciones sobre la 3ª pestaña "Gestión de conceptos".
- [x] 5.2 `frontend/e2e/gestion-conceptos.spec.ts`: cambiar `page.goto('/administracion/gestion-conceptos')`→`/gestion/conceptos`; heading esperado "Administración"→"Gestión".
- [x] 5.3 `frontend/e2e/layout.spec.ts`: sustituir `/gestion/movimientos`→`/movimientos`; eliminar el test de pestaña "Movimientos" dentro de Gestión; añadir test "Movimientos es un acceso de primer nivel independiente de Gestión" (mismo patrón que el test existente de Importar, líneas 29-40); añadir test de orden de menú (Dashboard, Movimientos, Importar, Historial, Resumen anual, Gestión, Backup).
- [x] 5.4 `frontend/e2e/manual-usuario-paginas.spec.ts`: test de Movimientos → navega a `/movimientos`, header esperado "Movimientos"; los 2 tests de Backup (Realizar/Importar) → rutas `/backup/realizar`/`/backup/importar`, header "Backup"; test de Gestión de conceptos → navega a `/gestion/conceptos`, header "Gestión".
- [x] 5.5 `frontend/e2e/historial.spec.ts`: `/administracion/gestion-conceptos`→`/gestion/conceptos`; heading "Administración"→"Gestión".
- [x] 5.6 `frontend/e2e/accesibilidad.spec.ts`: en array `RUTAS`, sustituir `/gestion/movimientos`→`/movimientos`; tests del tour de Movimientos navegan a `/movimientos`.
- [x] 5.7 `frontend/e2e/movimientos.spec.ts`: reemplazo sistemático de las 23 ocurrencias `/gestion/movimientos`→`/movimientos`.
- [x] 5.8 `frontend/e2e/categorias.spec.ts` (4 ocurrencias) y `frontend/e2e/cuentas.spec.ts` (1 ocurrencia): reemplazo `/gestion/movimientos`→`/movimientos`.
- [x] 5.9 (descubierto durante implementación, no estaba en el mapeo inicial) `frontend/src/vistas/VistaImportarExcel.vue`: `router.push({ path: '/gestion/movimientos', ... })` → `/movimientos`; `frontend/e2e/importar-excel.spec.ts` actualizado en consecuencia (ruta esperada y eliminada la aserción de pestaña "Movimientos", que ya no existe).

## Phase 6: Refinamientos de agrupación (feedback de usuario tras revisar el resultado)

- [x] 6.1 Renombrar la sub-página "Gestión de conceptos" → "Asociar conceptos" en `VistaGestion.vue` (pestaña) y `BarraLateral.vue` (`subseccionesGestion`); actualizar todos los tests E2E/comentarios que referenciaban el texto anterior (`layout.spec.ts`, `manual-usuario-paginas.spec.ts`, `gestion-conceptos.spec.ts`).
- [x] 6.2 Dar a "Asociar conceptos" un color propio (`text-lime-500`) en `subseccionesGestion`, distinto del de "Categorías" (`text-teal-500`), con el que compartía color por herencia de cuando vivían en menús distintos.
- [x] 6.3 Crear el primitivo que faltaba `frontend/src/componentes/ui/sidebar/SidebarGroupLabel.vue` (patrón shadcn-vue/Reka UI, igual que el resto de primitivos de `ui/sidebar/`) y exportarlo desde `index.ts`.
- [x] 6.4 En `BarraLateral.vue`: dividir el único `<SidebarGroup>` en dos, con `<SidebarGroupLabel>General</SidebarGroupLabel>` (Dashboard, Movimientos, Importar, Historial, Resumen anual) y `<SidebarGroupLabel>Configuración</SidebarGroupLabel>` (Gestión, Backup).
- [x] 6.5 Añadir en `VistaResumenAnual.vue` un botón "Asociar conceptos" (icono `Link2`, `RouterLink to="/gestion/conceptos"`) en la cabecera, con su propio paso de tour (`data-tour="resumen-anual-asociar-conceptos"`) como primer paso de `pasosTour()`.
- [x] 6.6 Actualizar `VistaResumenAnual.spec.ts` (nuevo paso al principio de la lista esperada) y `manual-usuario-paginas.spec.ts` (nuevo `avanzarHastaTitulo(page, 'Asociar conceptos')` antes de "Importar Excel").
- [x] 6.7 Actualizar la spec delta `manual-usuario` con los nuevos requisitos: "Tour de Asociar conceptos dentro de Gestión" (renombrado), "Acceso directo a Asociar conceptos desde Resumen anual", "Agrupación visual del menú lateral".

## Phase 7: Verificación final

- [x] 7.1 Ejecutar `pnpm exec vue-tsc --build --force`, `pnpm lint`, `pnpm exec vitest run`, `pnpm build` en `frontend/` — todos en verde (331/331 tests unitarios).
- [x] 7.2 Levantar pila E2E aislada (`docker compose -p gestor-gastos-e2e`, reconstruida desde cero varias veces) y ejecutar Playwright completo en modo CI (`CI=true`, 1 worker, con reintentos, igual que `.github/workflows/e2e.yml`). Encontrados y corregidos 2 bugs reales: (1) `backup.spec.ts` usaba `getByRole('link', {name:'Backup'})` sin `exact:true`, que ahora colisiona con "Realizar backup"/"Importar backup" (antes "Administración" no colisionaba con nada); (2) `importar-excel.spec.ts` tenía una segunda referencia a `/\/gestion\/movimientos\?cuenta_id=\d+/` en el test del PDF que el reemplazo global no capturó (contenía barras de escape de regex). Fallos restantes (`layout.spec.ts` "barra de estado", `manual-usuario.spec.ts` tour de Dashboard, varios `movimientos.spec.ts` marcados flaky) verificados como preexistentes: reproducidos de forma idéntica contra el código previo al cambio (commit 250a801, worktree temporal) compartiendo la misma base de datos ya cargada de datos de test — es el patrón ya documentado en memoria de acumulación de datos E2E degradando timings, no una regresión de este cambio.
- [x] 7.3 Lanzar `sdd-verify` para el cambio.
- [x] 7.4 Tras PASS, lanzar `sdd-archive` para fusionar el delta spec y archivar el cambio.
