# Informe de verificación: Historial coherente, importación PDF y límite de exportación

**Cambio**: historial-pdf-y-rendimiento-exportacion
**Modo**: Verificación retroactiva (la implementación ya se verificó y
fusionó antes de escribir este informe; se documenta aquí la evidencia real
recogida durante la sesión, no una re-ejecución).

---

### Completitud

| Métrica | Valor |
|---|---|
| Tareas totales | 26 |
| Tareas completas | 26 |

---

### Ejecución de build y tests (evidencia real de la sesión)

**Backend** (`uv run pytest -q`, tras el límite de años en exportación):
```
359 passed, 181 warnings in 320.17s (0:05:20)
```
(Antes del límite de años: 30-55 min por ejecución completa; el test de
contrato aislado del endpoint de exportación pasó de 15-19 min a 26 s.)

**Backend, calidad**: `ruff check`, `ruff format --check`, `lint-imports`,
`bandit` — todos en verde en cada PR.

**Frontend**: `pnpm exec vue-tsc --build --force` (sin salida = éxito),
`pnpm lint` (0 errores, 2 warnings preexistentes no relacionados), `pnpm
build` en verde.

**E2E** (Playwright, contra pila aislada `docker compose -p gestor-gastos-e2e`,
nunca contra el stack persistente con datos reales):
- `historial.spec.ts`: 5/5, incluido el nuevo escenario "Amazon Prime"
- `importar-excel.spec.ts`: 12/12, incluidos los 2 nuevos escenarios de PDF (importación y icono de origen)
- `accesibilidad.spec.ts`: 14/14 (sin violaciones WCAG 2.1 AA nuevas por el icono añadido)
- `movimientos.spec.ts`: 25/25

**CI en GitHub Actions**: los 4 PR (#117, #118, #119, #121) con todos los
checks en verde (`calidad-y-tests-backend`, `calidad-y-tests-frontend`,
`playwright`, `gitleaks`, `revision-dependencias`) antes de fusionarse.

---

### Matriz de cumplimiento de especificación

| Requisito | Escenario | Evidencia | Resultado |
|---|---|---|---|
| Historial: navegación coherente | Subcategoría solo localizable por asociación de descripción | `historial.spec.ts` ("Amazon Prime"), `test_listar_movimientos_por_categoria_resumen.py` | ✅ CUMPLE |
| Historial: navegación coherente | Categoría sin asociación se comporta igual que antes | `historial.spec.ts` (resto de escenarios, sin regresión) | ✅ CUMPLE |
| Importación PDF: subida | PDF válido / sin cabecera / sin movimientos | `test_lector_pdf_ing.py` (7 tests, fixtures sintéticos) | ✅ CUMPLE |
| Importación PDF: autocategorización | Coincide con asociación / no coincide (Sin categorizar) | `test_importar_movimientos_pdf.py` (9 tests) | ✅ CUMPLE |
| Importación PDF: reconocimiento de cuenta | Mismo CCC, distinto espaciado | `test_reconoce_una_cuenta_ya_existente_aunque_el_espaciado_del_numero_difiera` | ✅ CUMPLE |
| Deduplicación: espaciado distinto | Doble espacio en la descripción | `test_buscar_duplicado_ignora_diferencias_de_espaciado_en_la_descripcion` | ✅ CUMPLE |
| Marca de origen | Movimiento PDF muestra el indicador | `importar-excel.spec.ts` (captura `importar-pdf-02-icono-origen.png`) | ✅ CUMPLE |
| Marca de origen | Movimiento Excel no muestra el indicador | `importar-excel.spec.ts` (aserción de count 0) | ✅ CUMPLE |
| Marca de origen | Editar conserva la marca | `test_crear_persiste_el_origen_y_actualizar_no_lo_borra` | ✅ CUMPLE |
| Resumen anual: rango de años | Dentro / por debajo / por encima del límite | `test_limites_exportar_resumen_anual.py` (3 tests) | ✅ CUMPLE |
| Resumen anual: rango de años | Planificación del año siguiente | Escenario BDD existente ("de 2026 a 2027") sigue en verde | ✅ CUMPLE |

**Resumen de cumplimiento**: 11/11 escenarios cubiertos y en verde.

---

### Coherencia con el diseño

Todas las decisiones de `design.md` se siguieron sin desviación (implementación
y diseño se escribieron a la vez, de forma retroactiva, a partir del código
ya fusionado).

---

### Incidencias encontradas

**CRITICAL**: Ninguna.

**WARNING**: Ninguna.

**SUGGESTION**:
- El parseo del PDF está acoplado al formato del certificado de ING (ver
  "Preguntas abiertas" en `design.md`).
- Los flakes observados durante la sesión en `layout.spec.ts` (número de
  versión, depende de una llamada real a la API de GitHub) y en pasos de
  `seleccionarElementosFiltro` son preexistentes y no relacionados con este
  cambio; confirmados por re-ejecución aislada en verde.

---

### Veredicto

**PASS**. Las 4 piezas están implementadas, verificadas con evidencia real
(unitarios, integración, E2E, contrato, CI) y fusionadas en `main`.
