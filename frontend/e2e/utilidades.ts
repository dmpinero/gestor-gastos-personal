import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Abre un Select (haciendo click en su disparador) y elige la opción cuyo
 * texto empieza por `texto` usando el "typeahead" por teclado que Reka UI ya
 * soporta de forma nativa. Los desplegables de Select acumulan tantas
 * opciones como cuentas/categorías/etc. se hayan creado en la ejecución de
 * la suite: con muchas, el scroll interno del popover se gestiona con
 * botones propios de Radix (no con overflow nativo), y ni `.click()` ni
 * `scrollIntoViewIfNeeded()` logran desplazarse hasta una opción fuera del
 * área visible. Escribir el texto mueve el resaltado a la primera
 * coincidencia sin depender de scroll visual en absoluto.
 *
 * El algoritmo de typeahead de Reka UI (useTypeahead) solo mueve el foco
 * cuando el ítem resaltado deja de coincidir con la cadena acumulada; como
 * casi todos los nombres de prueba comparten un prefijo común ("Categoría
 * ..."), el foco puede quedar "pegado" en el primer ítem que coincidió
 * mientras la app todavía no ha procesado los últimos caracteres tecleados
 * (esto se agrava con la suite en paralelo, pero la carrera existe siempre).
 * Por eso se espera a que la opción objetivo reciba el foco del DOM antes
 * de confirmar con Enter, en vez de asumir que ya ha convergido.
 */
export async function elegirOpcion(page: Page, disparador: Locator, texto: string): Promise<void> {
  await disparador.click()
  await page.keyboard.type(texto, { delay: 0 })
  await expect(page.getByRole('option', { name: texto, exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
}

/**
 * Igual que `elegirOpcion`, pero para los Combobox (con buscador propio):
 * a diferencia de Select, el foco del DOM se queda siempre en el input (el
 * combobox sigue el patrón ARIA 1.2, con `aria-activedescendant` en vez de
 * tabindex rotatorio), así que la opción resaltada nunca pasa `:focused` —
 * hay que esperar a que Reka UI le añada `data-highlighted` en su lugar.
 *
 * Si el combobox ya tenía un valor elegido (p. ej. al editar un registro
 * existente), el input conserva ese texto tras el click: se selecciona todo
 * antes de escribir para que sustituya al valor anterior en vez de
 * concatenarse con él.
 */
export async function elegirOpcionBuscador(
  page: Page,
  disparador: Locator,
  texto: string,
): Promise<void> {
  await disparador.click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type(texto, { delay: 0 })
  await expect(page.getByRole('option', { name: texto, exact: true })).toHaveAttribute(
    'data-highlighted',
    '',
  )
  await page.keyboard.press('Enter')
}

/**
 * Selector de "Cuenta" del formulario de crear/editar movimiento: un Select
 * normal de una sola opción (mismo patrón que Categoría/Subcategoría), con
 * nombre accesible "Cuenta". `exact: true` porque, sin él, coincidiría
 * también con cualquier checkbox de fila cuyo aria-label ("Seleccionar el
 * movimiento ...") contenga la subcadena "cuenta" en la descripción.
 */
export async function elegirCuentaDelFormulario(
  page: Page,
  panel: Locator,
  numeroCuenta: string,
): Promise<void> {
  await elegirOpcion(page, panel.getByLabel('Cuenta', { exact: true }), numeroCuenta)
}

/**
 * Filtros "Cuenta"/"Categoría"/"Subcategoría" de la barra de filtros de
 * Movimientos: ya no son un Select de una sola opción, sino un Popover con
 * una casilla por elemento (todos marcados por defecto). Deja marcados
 * única y exclusivamente los elementos indicados, sea cual sea el estado
 * previo del popover.
 *
 * Parte siempre de "ninguno marcado" usando la casilla "Seleccionar todas"
 * en vez de desmarcar elemento a elemento: con muchas cuentas/categorías
 * acumuladas (habitual en un run de CI que ejecuta toda la suite), desmarcar
 * una a una es lento y puede superar el timeout del test. La casilla
 * "Seleccionar todas" no es idempotente (su efecto depende de si ya estaba
 * en todo/nada/una selección parcial), así que se fuerza el estado con como
 * máximo dos clics: si ya estaba en "todas marcadas" un clic basta; si no,
 * el primer clic marca todas y el segundo las desmarca. En ambos casos son
 * muchos menos clics que iterar todos los elementos.
 */
export async function seleccionarElementosFiltro(
  page: Page,
  etiquetaBoton: string,
  textos: string[],
): Promise<void> {
  await page.getByRole('button', { name: etiquetaBoton }).click()
  const contenedor = page.locator('[data-slot="popover-content"]')
  const casillaTodas = contenedor.getByRole('checkbox').first()
  if (await casillaTodas.isChecked()) {
    await casillaTodas.click()
  } else {
    await casillaTodas.click()
    await casillaTodas.click()
  }

  const filas = contenedor.locator('li')
  const total = await filas.count()
  for (let indice = 0; indice < total; indice++) {
    const fila = filas.nth(indice)
    const texto = (await fila.textContent())?.trim()
    if (texto !== undefined && textos.includes(texto)) {
      const casilla = fila.getByRole('checkbox')
      // La lista tiene su propio scroll interno (max-h-64 overflow-y-auto) y
      // el popover se reposiciona sobre su elemento ancla; un clic de ratón
      // necesita que el elemento esté visible y estable en coordenadas de
      // pantalla, lo que aquí no siempre converge. Activarla por teclado
      // (foco + Espacio) evita esa comprobación de viewport por completo:
      // solo hace falta que el elemento esté en el DOM y habilitado.
      await casilla.focus()
      await casilla.press(' ')
    }
  }
  await page.keyboard.press('Escape')
}

/** Ver `seleccionarElementosFiltro`: deja marcadas solo estas cuentas. */
export async function seleccionarCuentas(page: Page, numerosCuenta: string[]): Promise<void> {
  await seleccionarElementosFiltro(page, 'Filtrar por cuenta', numerosCuenta)
}

/** Ver `seleccionarElementosFiltro`: deja marcada solo esta única cuenta. */
export async function seleccionarCuenta(page: Page, numeroCuenta: string): Promise<void> {
  await seleccionarCuentas(page, [numeroCuenta])
}

/** Ver `seleccionarElementosFiltro`: deja marcadas solo estas categorías. */
export async function seleccionarCategorias(page: Page, nombresCategoria: string[]): Promise<void> {
  await seleccionarElementosFiltro(page, 'Filtrar por categoría', nombresCategoria)
}

/** Ver `seleccionarElementosFiltro`: deja marcada solo esta única categoría. */
export async function seleccionarCategoria(page: Page, nombreCategoria: string): Promise<void> {
  await seleccionarCategorias(page, [nombreCategoria])
}

/** Ver `seleccionarElementosFiltro`: deja marcadas solo estas subcategorías. */
export async function seleccionarSubcategorias(
  page: Page,
  nombresSubcategoria: string[],
): Promise<void> {
  await seleccionarElementosFiltro(page, 'Filtrar por subcategoría', nombresSubcategoria)
}

/** Ver `seleccionarElementosFiltro`: deja marcada solo esta única subcategoría. */
export async function seleccionarSubcategoria(
  page: Page,
  nombreSubcategoria: string,
): Promise<void> {
  await seleccionarSubcategorias(page, [nombreSubcategoria])
}
