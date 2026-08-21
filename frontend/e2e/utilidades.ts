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
 * Filtro "Cuenta" de la barra de filtros de Movimientos: ya no es un Select
 * de una sola opción, sino un Popover con una casilla por cuenta (todas
 * marcadas por defecto). Deja marcadas única y exclusivamente las cuentas
 * indicadas, sea cual sea el estado previo del popover (no basta con
 * alternar la casilla "Seleccionar todas", que no es idempotente: su efecto
 * depende de si ya estaba en todo/nada/una selección parcial).
 */
export async function seleccionarCuentas(page: Page, numerosCuenta: string[]): Promise<void> {
  await page.getByRole('button', { name: 'Filtrar por cuenta' }).click()
  const filas = page.locator('[data-slot="popover-content"] li')
  const total = await filas.count()
  for (let indice = 0; indice < total; indice++) {
    const fila = filas.nth(indice)
    const texto = (await fila.textContent())?.trim()
    const casilla = fila.getByRole('checkbox')
    if (texto !== undefined && numerosCuenta.includes(texto)) {
      await casilla.check()
    } else {
      await casilla.uncheck()
    }
  }
  await page.keyboard.press('Escape')
}

/** Ver `seleccionarCuentas`: deja marcada solo esta única cuenta. */
export async function seleccionarCuenta(page: Page, numeroCuenta: string): Promise<void> {
  await seleccionarCuentas(page, [numeroCuenta])
}
