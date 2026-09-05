# Informe de verificación: Manual de usuario interactivo

**Cambio**: manual-usuario-interactivo
**Versión**: N/A

---

### Completitud

| Métrica | Valor |
|---|---|
| Tareas totales | 26 |
| Tareas completas | 25 |
| Tareas incompletas | 1 |

Pendiente: 6.7 (`sdd-archive`) — es el siguiente paso tras este informe, no bloquea la verificación.

---

### Ejecución de build y tests

**Build**: ✅ Passed
```
pnpm build → vue-tsc --build (sin errores) + vite build ✓ built in 8.36s
```

**Tests unitarios (Vitest)**: ✅ 293 passed / ❌ 0 failed / ⚠️ 0 skipped
```
Test Files  46 passed (46)
     Tests  293 passed (293)
```
(Una ejecución previa del conjunto completo tuvo 1 timeout en
`exportarTabla.spec.ts`, fichero preexistente no tocado por este cambio;
confirmado como flake al reejecutarlo aislado: 2/2 en verde.)

**Lint**: ✅ `oxlint` + `eslint` sin errores (2 warnings preexistentes en
`movimientos.spec.ts`/`resumen-anual.spec.ts`, no relacionados).

**E2E (Playwright, contra pila aislada `docker compose -p gestor-gastos-e2e`)**:
- `manual-usuario.spec.ts`: ✅ 7/7
- `accesibilidad.spec.ts`: ✅ 16/16 (incluye los 2 escenarios nuevos del tour)
- `layout.spec.ts`: ✅ 8/8 (sin regresión en `BarraSuperior`/`BarraLateral`)

**Coverage**: ➖ No configurado (sin `coverage_threshold` en `openspec/config.yaml`)

---

### Matriz de cumplimiento de especificación

| Requisito | Escenario | Test | Resultado |
|---|---|---|---|
| Lanzar el tour desde el icono de ayuda | Pulsar el icono inicia el tour | `manual-usuario.spec.ts > pulsar el icono de ayuda lanza el tour y resalta el primer paso` | ✅ COMPLIANT |
| El tour nunca se lanza automáticamente | Cargar la aplicación no lanza el tour | `manual-usuario.spec.ts > recargar la aplicación no lanza el tour automáticamente` | ✅ COMPLIANT |
| Recorrido de las secciones principales | Avanzar por los pasos del tour | `manual-usuario.spec.ts > recorre en orden las secciones, el tema y el icono de ayuda` | ✅ COMPLIANT |
| Recorrido de las secciones principales | Retroceder a un paso anterior | `manual-usuario.spec.ts > el botón "Anterior" retrocede al paso previo` | ✅ COMPLIANT |
| Cerrar el tour en cualquier momento | Cerrar con el botón | `manual-usuario.spec.ts > cerrar con el botón de cerrar oculta el tour` | ✅ COMPLIANT |
| Cerrar el tour en cualquier momento | Cerrar con la tecla Escape | `manual-usuario.spec.ts > cerrar con la tecla Escape oculta el tour igual que el botón` | ✅ COMPLIANT |
| Accesibilidad del tour | Navegación completa por teclado | `manual-usuario.spec.ts > el tour se recorre por completo solo con el teclado` | ✅ COMPLIANT |
| Accesibilidad del tour | Sin violaciones de accesibilidad en modo oscuro | `accesibilidad.spec.ts > el manual de usuario interactivo no tiene violaciones de accesibilidad en modo oscuro (WCAG 2.1 AA)` | ✅ COMPLIANT |

**Resumen de cumplimiento**: 8/8 escenarios cumplidos. (Se añadió además el
mismo test en modo claro, no exigido explícitamente por la spec pero
consistente con el resto de la suite de accesibilidad del proyecto.)

---

### Corrección (estática)

| Requisito | Estado | Notas |
|---|---|---|
| Lanzar el tour desde el icono de ayuda | ✅ Implementado | `BotonManualUsuario.vue` + `useTourGuiado.ts` |
| El tour nunca se lanza automáticamente | ✅ Implementado | Sin ninguna llamada a `iniciar()` fuera del `@click` del botón |
| Recorrido de las secciones principales | ✅ Implementado | 8 pasos en `useTourGuiado.ts`, orden verificado por test unitario y E2E |
| Cerrar el tour en cualquier momento | ✅ Implementado | Comportamiento nativo de driver.js (botón/Escape/click fuera); botón y Escape verificados por E2E |
| Accesibilidad del tour | ✅ Implementado | driver.js gestiona foco/teclado/`role="dialog"` de fábrica; CSS propio en `main.css` para contraste en ambos temas |

---

### Coherencia con el diseño

| Decisión | ¿Seguida? | Notas |
|---|---|---|
| Selectores por `data-tour="..."` | ✅ Sí | 8 atributos añadidos, ninguno depende de texto visible |
| Composable de módulo sin Pinia | ✅ Sí | `useTourGuiado.ts` sin store |
| CSS propio sobre las clases de driver.js con variables oklch existentes | ✅ Sí | Sección nueva en `main.css`, sin duplicar reglas por tema |
| Botón nuevo (`BotonManualUsuario.vue`) en vez de combinarlo con `ConmutadorTema.vue` | ✅ Sí | Componentes separados, cada uno con una responsabilidad |
| ⚠️ No documentado en el diseño original: `onPopoverRender` para el `aria-label` del botón de cerrar | — | Añadido durante la implementación (ver más abajo) |

---

### Incidencias encontradas

**CRITICAL**: Ninguna.

**WARNING**: Ninguna.

**SUGGESTION**:
- Hallazgo real durante la implementación, no previsto en `design.md`: el
  botón de cerrar de driver.js trae `aria-label="Close"` fijo en inglés (no
  configurable por las opciones estándar de `Config`). Se corrigió con el
  hook `onPopoverRender` en `useTourGuiado.ts` para ponerlo en español
  ("Cerrar"), con su propio test unitario
  (`useTourGuiado.spec.ts > traduce al español el aria-label del botón de
  cerrar de driver.js`). No bloquea el archivado; se deja anotado porque
  `design.md` no lo preveía.
- El tour cubre solo la navegación principal (alcance explícito de la
  propuesta); tours contextuales por vista quedan fuera de alcance, como ya
  se documentó.

---

### Veredicto

**PASS**. Los 8 escenarios de la spec están implementados, verificados con
evidencia real de ejecución (unitarios, E2E, accesibilidad) y sin
incidencias que bloqueen el archivado.
