# Tasks: Tour del manual de usuario específico por página (Dashboard + Gestión)

## Phase 1: Arquitectura del composable (TDD)

- [x] 1.1 RED: `useTourGuiado.spec.ts` — orientación resalta `nav-gestion` cuando la ruta es `gestion-movimientos`, `nav-dashboard` cuando es `inicio`, etc.
- [x] 1.2 RED: pasos finales = orientación + pasos del proveedor registrado + cierre (tema, ayuda)
- [x] 1.3 RED: sin proveedor registrado, el tour es solo orientación + cierre (no falla)
- [x] 1.4 RED: al destruirse el tour (`onDestroyStarted`), se llama `alFinalizar` del proveedor activo
- [x] 1.5 GREEN: reescribir `useTourGuiado.ts` (`ProveedorTourPagina`, `useRegistrarTourPagina`, `pasoOrientacionPara`, `pasosCierre`, `iniciar()`)
- [x] 1.6 REFACTOR: revisar tipos y nombres. Hallazgo durante la implementación: Driver.js NO cierra el tour si se pasa `onDestroyStarted` (delega el cierre al consumidor); hay que llamar a `instancia.destroy()` dentro del hook.

## Phase 2: Dashboard (TDD)

- [x] 2.1 RED: `VistaInicio.spec.ts` — `pasosTour()` incluye saldo global, tarjetas por cuenta, gastos/ingresos por categoría
- [x] 2.2 RED: si `tienda.resumen` es `null`, `pasosTour()` devuelve un único paso sin elemento
- [x] 2.3 GREEN: `data-tour` en `VistaInicio.vue` + `pasosTour()` + `useRegistrarTourPagina(...)`

## Phase 3: Cuentas (TDD)

- [x] 3.1 RED: `pasosTour()` incluye crear cuenta, filtros, tabla, exportar, selección múltiple, paginación
- [x] 3.2 RED: `antesDeIniciar` marca la primera fila si existe; `alFinalizar` restaura la selección previa exacta
- [x] 3.3 GREEN: `data-tour` en `VistaCuentas.vue` + `pasosTour()` + `antesDeIniciar`/`alFinalizar` + registro

## Phase 4: Categorías (TDD)

- [x] 4.1 RED: `pasosTour()` incluye crear categoría, filtros, selección múltiple, tarjeta de categoría con subcategorías
- [x] 4.2 RED: `antesDeIniciar` marca la primera fila; `alFinalizar` restaura la selección previa exacta
- [x] 4.3 GREEN: `data-tour` en `VistaCategorias.vue` + `pasosTour()` + `antesDeIniciar`/`alFinalizar` + registro

## Phase 5: Movimientos (TDD)

- [x] 5.1 RED: `pasosTour()` incluye crear movimiento, filtros, "Mes anterior/siguiente", agrupar/exportar, selección múltiple, tabla, paginación
- [x] 5.2 RED: `antesDeIniciar` fija `fechaDesde`/`fechaHasta` al mes actual completo y marca la primera fila; `alFinalizar` restaura los valores previos exactos
- [x] 5.3 GREEN: `data-tour` en `VistaMovimientos.vue` + `pasosTour()` + `antesDeIniciar`/`alFinalizar` + registro. Hallazgo durante la implementación (detectado por un test unitario): la selección debe forzarse ANTES de forzar el filtro de fechas, o la fila elegida puede quedar fuera del rango de fechas forzado (mes actual) y no seleccionarse.

## Phase 6: E2E

- [x] 6.1 Actualizar `frontend/e2e/manual-usuario.spec.ts` a la nueva orientación+cierre (ya no recorre las 6 secciones)
- [x] 6.2 Nuevo `frontend/e2e/manual-usuario-paginas.spec.ts`: Cuentas, Categorías, Movimientos — orientación correcta, recorrido completo sin bloquearse (Dashboard cubierto en `manual-usuario.spec.ts`)
- [x] 6.3 E2E: en Movimientos, "Mes anterior"/"Mes siguiente" visibles durante el tour y filtro de fechas vacío tras cerrarlo
- [x] 6.4 Ampliar `frontend/e2e/accesibilidad.spec.ts` con el tour de Movimientos, claro y oscuro. Hallazgo adicional: el popover de Driver.js tiene una animación de aparición (~0.4s); auditar con axe-core antes de que termine producía un falso positivo intermitente de contraste — se corrigió esperando a que la opacidad llegue a 1 antes de auditar (afecta también a los dos tests de accesibilidad del tour ya existentes)

## Phase 7: Verificación final

- [x] 7.1 `pnpm exec vue-tsc --build --force` en verde
- [x] 7.2 `pnpm lint` en verde
- [x] 7.3 `pnpm exec vitest run` en verde (318/318; 1 flake preexistente confirmado en fichero no relacionado)
- [x] 7.4 `pnpm build` en verde
- [x] 7.5 Playwright contra pila aislada (`-p gestor-gastos-e2e`) en verde (61/62; el único fallo es el flake ya documentado de `seleccionarElementosFiltro`, confirmado no relacionado)
- [x] 7.6 `sdd-verify`
- [x] 7.7 `sdd-archive`

## Phase 8: Refinamiento tras la vista previa (feedback del usuario)

- [x] 8.1 El paso genérico "Gráficos" de Movimientos se desglosa en 5 pasos: Saldo, Evolución de gastos, Evolución de ingresos, Evolución de gastos vs ingresos (comparativo), Top 10 categorías. Los popover de evolución/comparativo mencionan los 4 tipos de gráfico disponibles (barras/líneas/área/circular) y, en el comparativo, la posibilidad de pulsar la leyenda para aislar gasto/ingreso/saldo.
- [x] 8.2 Hallazgo real durante la implementación: forzar el filtro de fechas al mes EN CURSO (para revelar "Mes anterior/siguiente") podía vaciar toda la sección de Gráficos si los movimientos reales no eran de ese mes (`movimientosGastados`/`Ingresos` se calculan sobre el listado ya filtrado por fecha) — se corrigió derivando el mes forzado del movimiento más reciente en vez de la fecha de hoy.
- [x] 8.3 Tests actualizados: `VistaMovimientos.spec.ts` (nuevos pasos), `manual-usuario-paginas.spec.ts` (recorre los pasos de gráficos con datos reales de gasto e ingreso)
- [x] 8.4 Re-verificación completa (`vue-tsc`, `lint`, `vitest`, `build`, Playwright contra pila aislada) en verde
