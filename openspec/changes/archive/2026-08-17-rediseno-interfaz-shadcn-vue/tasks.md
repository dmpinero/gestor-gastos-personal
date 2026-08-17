# Tasks: Rediseño de la interfaz con shadcn-vue sobre Reka UI

## Phase 1: Base de diseño

- [x] 1.1 `pnpm add reka-ui lucide-vue-next class-variance-authority clsx tailwind-merge` y `pnpm add -D tw-animate-css` en `frontend/`.
- [x] 1.2 Crear `frontend/components.json` con alias `@/componentes/ui`.
- [x] 1.3 Crear `frontend/src/lib/utils.ts` con `cn()`.
- [x] 1.4 Reescribir `frontend/src/assets/main.css`: tokens `oklch` en `:root`/`.dark`, `@theme inline`, `@custom-variant dark`.
- [x] 1.5 Añadir script anti-FOUC inline en `frontend/index.html`.
- [x] 1.6 Test Vitest `frontend/src/composables/__tests__/useModoOscuro.spec.ts` (persistencia en `localStorage`, respeto de `matchMedia` sin valor guardado).
- [x] 1.7 Implementar `frontend/src/composables/useModoOscuro.ts` hasta pasar 1.6.

## Phase 2: Componentes shadcn-vue base

- [x] 2.1 Copiar `button`, `input`, `label` a `frontend/src/componentes/ui/`.
- [x] 2.2 Copiar `table` (Table/TableHeader/TableBody/TableRow/TableHead/TableCell).
- [x] 2.3 Copiar `select` (Select/SelectTrigger/SelectValue/SelectContent/SelectItem).
- [x] 2.4 Copiar `alert-dialog` completo.
- [x] 2.5 Copiar `tooltip`, `separator`, `sheet`, `card`.
- [x] 2.6 Copiar `sidebar` (incluye `useSidebar.ts`) y verificar en `pnpm dev` que `side="right"` renderiza correctamente.

## Phase 3: Layout

- [x] 3.1 Crear `frontend/src/componentes/layout/ConmutadorTema.vue` (Sun/Moon, `role="switch"`, `aria-checked`/`aria-label`).
- [x] 3.2 Crear `frontend/src/componentes/layout/BarraSuperior.vue` (mantiene `<h1>Gestor de Gastos Personal</h1>` + `ConmutadorTema`).
- [x] 3.3 Crear `frontend/src/componentes/layout/BarraLateral.vue` (`Sidebar side="right" collapsible="icon"`, 5 secciones con iconos Lucide, `:tooltip`, `SidebarTrigger`).
- [x] 3.4 Reescribir `frontend/src/App.vue` con `SidebarProvider`/`SidebarInset` + `BarraSuperior`/`BarraLateral`.
- [x] 3.5 Verificación manual en `pnpm dev`: colapsar/expandir, resaltado de ruta activa, persistencia del tema tras recargar (escenarios de la spec `interfaz`).

## Phase 4: Confirmación de borrado

- [x] 4.1 Test Vitest `frontend/src/componentes/compartido/__tests__/DialogoConfirmarEliminacion.spec.ts` (emite `confirmar` solo tras click en `AlertDialogAction`; cancelar no emite nada).
- [x] 4.2 Implementar `frontend/src/componentes/compartido/DialogoConfirmarEliminacion.vue` hasta pasar 4.1.

## Phase 5: Migrar `VistaCuentas.vue`

- [x] 5.1 Sustituir `<input>` por `Input`+`Label` preservando placeholders (`Número de cuenta`, `Alias`, `Entidad bancaria`, `Moneda`, `Titular`).
- [x] 5.2 Sustituir `<table>` por `Table`/`TableRow`/`TableCell`.
- [x] 5.3 Sustituir botones por `Button` (`Crear cuenta`/`Guardar cambios`, `Cancelar`, `Editar`) e integrar `DialogoConfirmarEliminacion` en el botón `Eliminar`.

## Phase 6: Migrar `VistaCategorias.vue`

- [x] 6.1 Sustituir `<input>`/botones por `Input`/`Button` (`Nueva categoría`, `Crear categoría`, `Nueva subcategoría`, `Añadir`).
- [x] 6.2 Agrupar cada categoría en `Card`/`CardHeader`/`CardContent`.
- [x] 6.3 Integrar `DialogoConfirmarEliminacion` en `Eliminar categoría` y `Eliminar` (subcategoría).

## Phase 7: Migrar `VistaMovimientos.vue`

- [x] 7.1 Sustituir `<select>` de Cuenta por `Select`+`Label for="selector-cuenta"`.
- [x] 7.2 Sustituir `<select>` de Categoría por `Select`+`Label for="selector-categoria"`.
- [x] 7.3 Sustituir `<select>` de Subcategoría por `Select`+`Label for="selector-subcategoria"`.
- [x] 7.4 Sustituir el resto de `<input>`/tabla/botones igual que Phase 5, con `DialogoConfirmarEliminacion` en `Eliminar`.

## Phase 8: Drag & drop

- [x] 8.1 Test Vitest `frontend/src/componentes/importacion/__tests__/ZonaSoltarFichero.spec.ts` (emite `fichero-elegido` en `drop` y en `change` del input; estado `dragover` en `dragenter`/`dragleave`).
- [x] 8.2 Implementar `frontend/src/componentes/importacion/ZonaSoltarFichero.vue` hasta pasar 8.1.
- [x] 8.3 Integrar en `frontend/src/vistas/VistaImportarExcel.vue`, sustituyendo el `<input type="file">` visible por el componente (que lo mantiene oculto con `sr-only`).

## Phase 9: Tests E2E y capturas

- [x] 9.1 Actualizar `frontend/e2e/cuentas.spec.ts` y `categorias.spec.ts`: confirmar en `AlertDialog` antes de comprobar borrado; captura del diálogo abierto.
- [x] 9.2 Actualizar `frontend/e2e/movimientos.spec.ts`: sustituir `.selectOption()` por clicks a `Select`/`option` (Cuenta y Categoría) + confirmación de borrado.
- [x] 9.3 Añadir test de `drop` con `DataTransfer` sintético en `frontend/e2e/importar-excel.spec.ts` + captura del estado `dragover`.
- [x] 9.4 Crear `frontend/e2e/layout.spec.ts`: capturas de sidebar expandido/colapsado y modo claro/oscuro con recarga (persistencia).
- [x] 9.5 Crear `frontend/e2e/accesibilidad.spec.ts`: axe-core sobre las 5 rutas en claro y oscuro; retirar el test de axe-core de `inicio.spec.ts`.

## Phase 10: Verificación final

- [x] 10.1 `pnpm lint` (oxlint + eslint).
- [x] 10.2 `pnpm test:unit` (stores existentes sin cambios + nuevos tests de 1.6/4.1/8.1).
- [x] 10.3 `pnpm build` (`vue-tsc --build` + `vite build`).
- [x] 10.4 `pnpm test:e2e` completo contra backend real, revisar capturas nuevas en `frontend/e2e/capturas/`.
- [x] 10.5 `sdd-verify` contra las specs `interfaz` e `importacion-excel` (delta).
- [x] 10.6 `sdd-archive` del cambio `rediseno-interfaz-shadcn-vue`.
