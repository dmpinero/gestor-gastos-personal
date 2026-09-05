# Verification Report: Tour del manual de usuario específico por página (Dashboard + Gestión)

**Change**: tour-por-pagina-dashboard-gestion

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 22 |
| Tasks complete | 22 |

---

### Build & Tests Execution

**Build**: ✅ `pnpm build` en verde.

**Tests (Vitest)**: ✅ 318/318 (1 flake preexistente en `exportarTabla.spec.ts`, no relacionado, confirmado al reejecutar aislado). Incluye 4 tests nuevos en `useTourGuiado.spec.ts`, 2 en `VistaInicio.spec.ts`, 2 en `VistaCuentas.spec.ts`, 2 en `VistaCategorias.spec.ts`, 3 en `VistaMovimientos.spec.ts`.

**E2E (Playwright, contra pila aislada `-p gestor-gastos-e2e`)**: ✅ 61/62.
- `manual-usuario.spec.ts` (7/7), `manual-usuario-paginas.spec.ts` (3/3), `accesibilidad.spec.ts` (20/20, incluye los 2 tests nuevos del tour de Movimientos claro/oscuro).
- `movimientos.spec.ts` + `cuentas.spec.ts` + `categorias.spec.ts` (33/34; único fallo: `el filtro de cuenta permite seleccionar varias cuentas...`, flake ya documentado en memoria de sesión de `seleccionarElementosFiltro`, reproducido también sin este cambio en pasadas anteriores).

---

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Recorrido de las secciones principales (MODIFICADO) | Lanzar el tour desde Movimientos recorre Movimientos, no las demás secciones | `e2e/manual-usuario-paginas.spec.ts > Movimientos: ...` + `useTourGuiado.spec.ts > la orientación para la ruta "gestion-movimientos" resalta [data-tour="nav-gestion"]` | ✅ COMPLIANT |
| Recorrido de las secciones principales (MODIFICADO) | Lanzar el tour desde el Dashboard recorre sus tarjetas y bloques | `e2e/manual-usuario.spec.ts > en el Dashboard, tras la orientación recorre sus tarjetas...` + `VistaInicio.spec.ts > el tour de la página recorre el saldo global...` | ✅ COMPLIANT |
| Elementos condicionales forzados temporalmente | "Mes anterior"/"Mes siguiente" se muestran durante el tour de Movimientos | `e2e/manual-usuario-paginas.spec.ts > Movimientos: "Mes anterior/siguiente"...` + `VistaMovimientos.spec.ts > fuerza el filtro de fechas al mes actual...` | ✅ COMPLIANT |
| Elementos condicionales forzados temporalmente | La barra de selección múltiple se muestra durante el tour | `e2e/manual-usuario-paginas.spec.ts` (Cuentas/Categorías/Movimientos, paso "Acciones en bloque") + `VistaCuentas.spec.ts`/`VistaCategorias.spec.ts`/`VistaMovimientos.spec.ts > marca... restaura la selección previa` | ✅ COMPLIANT |
| Elementos condicionales no simulados | Un elemento que depende de datos aún no cargados no rompe el tour | `VistaInicio.spec.ts > si el resumen aún no ha cargado, el tour muestra un único paso sin resaltar nada` | ✅ COMPLIANT |

**Compliance summary**: 5/5 escenarios de la spec.

---

### Correctness (Static)
| Requirement | Status | Notes |
|------------|--------|-------|
| Recorrido de las secciones principales (MODIFICADO) | ✅ Implemented | `useTourGuiado.ts`: `pasoOrientacion` + proveedor de página |
| Elementos condicionales forzados temporalmente | ✅ Implemented | `antesDeIniciar`/`alFinalizar` en Cuentas, Categorías, Movimientos |
| Elementos condicionales no simulados | ✅ Implemented | `skipMissingElement: true` global + fallback en Dashboard |

---

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Registro por página vía `useRegistrarTourPagina` | ✅ Yes | |
| Orientación: mapa ruta → sección fija | ✅ Yes | |
| Restauración en `onDestroyStarted` | ✅ Yes | Requirió llamar a `instancia.destroy()` explícitamente (hallazgo no anticipado en el diseño, ver `tasks.md` 1.6) |
| `skipMissingElement` + fallback Dashboard | ✅ Yes | |

---

### Issues Found

**CRITICAL**: None

**WARNING**: None

**SUGGESTION**:
- El tour de Movimientos tiene 15 pasos específicos de página (18 en total con orientación y cierre) — el más largo de los cuatro. Coherente con ser "la más rica en funcionalidades" y el caso que motivó la petición, pero vale la pena vigilar en el cambio 2 si el resto de páginas necesitan un recorrido igual de exhaustivo o si conviene resumir algunos filtros en un solo paso.
- Hallazgo de accesibilidad no relacionado con el código de producción: el popover de Driver.js tarda ~0.4s en aparecer (fade-in); auditar con axe-core sin esperar a que termine produce un falso positivo intermitente de contraste. Corregido en los tests (`esperarPopoverEstable`), documentado por si se reutiliza el patrón en el cambio 2.

---

### Verdict
**PASS**. Los 5 escenarios de la spec están verificados con evidencia de ejecución real (unitarios + E2E), sin regresiones detectadas en las suites existentes de Movimientos, Cuentas, Categorías, Dashboard y accesibilidad.
