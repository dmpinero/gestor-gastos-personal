import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { elegirOpcion, seleccionarCuenta } from './utilidades'

async function crearMovimiento(
  page: Page,
  numeroCuenta: string,
  nombreCategoria: string,
  subcategoria: string | null,
  descripcion: string,
  importe: string,
): Promise<void> {
  await seleccionarCuenta(page, numeroCuenta)
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill('2026-01-01')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await seleccionarSubcategoriaSiAplica(page, panel, subcategoria)
  await panel.getByPlaceholder('Descripción').fill(descripcion)
  await panel.getByPlaceholder('Importe').fill(importe)
  await panel.getByPlaceholder('Saldo').fill('1000.00')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
}

async function seleccionarSubcategoriaSiAplica(
  page: Page,
  panel: ReturnType<Page['getByRole']>,
  subcategoria: string | null,
): Promise<void> {
  if (!subcategoria) return
  await elegirOpcion(page, panel.getByLabel('Subcategoría', { exact: true }), subcategoria)
}

test('sin selección muestra un mensaje para elegir categoría o subcategoría', async ({ page }) => {
  await page.goto('/historial')
  await expect(
    page.getByText(
      'Selecciona una categoría o subcategoría en el menú lateral para ver su evolución.',
    ),
  ).toBeVisible()
})

test('navegar por categoría y subcategoría en el historial muestra gastos e ingresos, cruzando cuentas', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuentaA = `ES00 HIST-A ${sufijo}`
  const numeroCuentaB = `ES00 HIST-B ${sufijo}`
  const nombreCategoria = `Categoria HIST ${sufijo}`
  const nombreSubcategoria = `Subcategoria HIST ${sufijo}`
  const descripcionGastoA = `Gasto cuenta A ${sufijo}`
  const descripcionGastoB = `Gasto cuenta B ${sufijo}`
  const descripcionIngreso = `Ingreso ${sufijo}`
  const descripcionGastoSub = `Gasto con subcategoría ${sufijo}`

  await page.goto('/gestion/cuentas')
  for (const numero of [numeroCuentaA, numeroCuentaB]) {
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const panel = page.getByRole('dialog')
    await panel.getByPlaceholder('Número de cuenta').fill(numero)
    await panel.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.locator('tr', { hasText: numero })).toBeVisible()
  }

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoria = page.getByRole('dialog')
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  const tarjetaCategoria = page.locator('[data-slot="card"]', { hasText: nombreCategoria })
  await expect(tarjetaCategoria).toBeVisible()
  await tarjetaCategoria.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaCategoria.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaCategoria.locator('li', { hasText: nombreSubcategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await crearMovimiento(page, numeroCuentaA, nombreCategoria, null, descripcionGastoA, '-15.00')
  await crearMovimiento(page, numeroCuentaB, nombreCategoria, null, descripcionGastoB, '-25.00')
  await crearMovimiento(page, numeroCuentaA, nombreCategoria, null, descripcionIngreso, '300.00')
  await crearMovimiento(
    page,
    numeroCuentaA,
    nombreCategoria,
    nombreSubcategoria,
    descripcionGastoSub,
    '-8.00',
  )

  // Navegar a la categoría desde el panel lateral (la sección empieza contraída).
  await page.getByRole('button', { name: 'Expandir Historial' }).click()
  await page.getByRole('link', { name: nombreCategoria, exact: true }).click()
  await expect(page).toHaveURL(/\/historial\/categoria\/\d+/)
  await expect(page.getByRole('heading', { name: nombreCategoria })).toBeVisible()

  // El Historial se ve agrupado por categoría/subcategoría por defecto: se
  // cambia a la vista plana para las comprobaciones fila a fila de este test.
  await page.getByRole('button', { name: 'Ver todos los movimientos' }).click()

  const filas = page.locator('tbody tr')
  await expect(filas.filter({ hasText: descripcionGastoA })).toBeVisible()
  await expect(filas.filter({ hasText: descripcionGastoB })).toBeVisible()
  await expect(filas.filter({ hasText: descripcionGastoSub })).toBeVisible()
  await expect(filas.filter({ hasText: descripcionIngreso })).toBeVisible()
  await expect(filas.filter({ hasText: descripcionGastoA })).toContainText(numeroCuentaA)
  await expect(filas.filter({ hasText: descripcionGastoB })).toContainText(numeroCuentaB)

  // Resumen: 15 + 25 + 8 = 48 € gastados en 3 movimientos, 300 € ingresados en 1.
  const tarjetaTotalGastado = page.locator('[data-slot="card"]', { hasText: 'Total gastado' })
  const tarjetaMovimientosGastos = tarjetaTotalGastado.locator('xpath=following-sibling::*[1]')
  const tarjetaTotalIngresado = page.locator('[data-slot="card"]', { hasText: 'Total ingresado' })
  const tarjetaMovimientosIngresos = tarjetaTotalIngresado.locator('xpath=following-sibling::*[1]')
  await expect(tarjetaTotalGastado).toContainText('-48,00 €')
  await expect(tarjetaMovimientosGastos).toContainText('3')
  await expect(tarjetaTotalIngresado).toContainText('300,00 €')
  await expect(tarjetaMovimientosIngresos).toContainText('1')
  await page.screenshot({ path: 'e2e/capturas/historial-01-categoria.png' })

  // Los gráficos de evolución de gastos y de ingresos se muestran por
  // separado, y cada uno se puede cambiar a visualización de líneas.
  await expect(page.getByText('Evolución de gastos', { exact: true })).toBeVisible()
  await expect(page.getByText('Evolución de ingresos', { exact: true })).toBeVisible()
  await expect(page.locator('svg[role="img"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Ver como líneas' }).first().click()
  await expect(page.locator('svg[role="img"]')).toBeVisible()
  await expect(page.locator('polygon')).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/historial-02-grafico-lineas.png' })

  await page.getByRole('button', { name: 'Ver como área' }).first().click()
  await expect(page.locator('polygon')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/historial-03-grafico-area.png' })

  await page.getByRole('button', { name: 'Ver como barras' }).first().click()
  await expect(page.locator('svg[role="img"]')).toHaveCount(0)

  // Rango de fecha completa que incluye el día de los movimientos (todos
  // creados el 2026-01-01): los mantiene.
  await page.getByLabel('Fecha desde').fill('2026-01-01')
  await page.getByLabel('Fecha hasta').fill('2026-01-01')
  await expect(filas.filter({ hasText: descripcionGastoA })).toBeVisible()
  await expect(tarjetaTotalGastado).toContainText('-48,00 €')

  // Rango que no incluye ningún movimiento: la tabla, el resumen y los
  // gráficos desaparecen (igual que en Movimientos cuando no hay datos).
  await page.getByLabel('Fecha desde').fill('2026-02-01')
  await page.getByLabel('Fecha hasta').fill('2026-03-01')
  await expect(filas.filter({ hasText: descripcionGastoA })).toHaveCount(0)
  await expect(page.getByText('Total gastado', { exact: true })).toBeHidden()
  await expect(page.getByText('Total ingresado', { exact: true })).toBeHidden()
  await expect(
    page.getByText(`No hay movimientos registrados para ${nombreCategoria}.`),
  ).toBeVisible()
  await expect(page.getByText('Evolución de gastos', { exact: true })).toBeHidden()
  await expect(page.getByText('Evolución de ingresos', { exact: true })).toBeHidden()

  // Vaciar el rango restaura los datos.
  await page.getByLabel('Fecha desde').fill('')
  await page.getByLabel('Fecha hasta').fill('')
  await expect(filas.filter({ hasText: descripcionGastoA })).toBeVisible()

  const resultadoAxe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('.vue-devtools__anchor-btn')
    .analyze()
  expect(resultadoAxe.violations).toEqual([])

  // Navegar a la subcategoría desde el panel lateral.
  await page.getByRole('link', { name: nombreSubcategoria }).click()
  await expect(page).toHaveURL(/\/historial\/subcategoria\/\d+/)
  await expect(filas.filter({ hasText: descripcionGastoSub })).toBeVisible()
  await expect(filas.filter({ hasText: descripcionGastoA })).toHaveCount(0)
  await expect(filas.filter({ hasText: descripcionGastoB })).toHaveCount(0)
})

test('un movimiento se puede editar directamente desde el historial', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 HIST-EDIT ${sufijo}`
  const nombreCategoria = `Categoria HIST-EDIT ${sufijo}`
  const descripcionOriginal = `Gasto original ${sufijo}`
  const descripcionEditada = `Gasto editado ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoria = page.getByRole('dialog')
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await crearMovimiento(page, numeroCuenta, nombreCategoria, null, descripcionOriginal, '-12.00')

  await page.getByRole('button', { name: 'Expandir Historial' }).click()
  await page.getByRole('link', { name: nombreCategoria, exact: true }).click()
  await expect(page).toHaveURL(/\/historial\/categoria\/\d+/)

  // El Historial se ve agrupado por categoría/subcategoría por defecto: se
  // cambia a la vista plana para editar desde la fila directamente.
  await page.getByRole('button', { name: 'Ver todos los movimientos' }).click()

  const fila = page.locator('tbody tr', { hasText: descripcionOriginal })
  await expect(fila).toBeVisible()
  await fila.getByRole('button', { name: 'Editar' }).click()

  const panelEdicion = page.getByRole('dialog')
  await expect(panelEdicion.getByRole('heading', { name: 'Editar movimiento' })).toBeVisible()
  await panelEdicion.getByPlaceholder('Descripción').fill(descripcionEditada)
  await panelEdicion.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect(page.locator('tbody tr', { hasText: descripcionEditada })).toBeVisible()
  await expect(page.locator('tbody tr', { hasText: descripcionOriginal })).toHaveCount(0)
})

test('el Historial se ve agrupado por categoría/subcategoría por defecto, y se puede alternar a la vista plana', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 HIST-AGRUP ${sufijo}`
  const nombreCategoria = `Categoria HIST-AGRUP ${sufijo}`
  const nombreSubcategoria = `Subcategoria HIST-AGRUP ${sufijo}`
  const descripcionGasto = `Gasto agrupado ${sufijo}`
  const descripcionIngreso = `Ingreso agrupado ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoria = page.getByRole('dialog')
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  const tarjetaCategoria = page.locator('[data-slot="card"]', { hasText: nombreCategoria })
  await expect(tarjetaCategoria).toBeVisible()
  await tarjetaCategoria.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaCategoria.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaCategoria.locator('li', { hasText: nombreSubcategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await crearMovimiento(
    page,
    numeroCuenta,
    nombreCategoria,
    nombreSubcategoria,
    descripcionGasto,
    '-15.00',
  )
  await crearMovimiento(
    page,
    numeroCuenta,
    nombreCategoria,
    nombreSubcategoria,
    descripcionIngreso,
    '200.00',
  )

  await page.getByRole('button', { name: 'Expandir Historial' }).click()
  await page.getByRole('link', { name: nombreCategoria, exact: true }).click()
  await expect(page).toHaveURL(/\/historial\/categoria\/\d+/)

  // Agrupado por defecto, sin tener que pulsar ningún botón.
  await expect(page.getByRole('button', { name: 'Ver todos los movimientos' })).toBeVisible()
  await expect(page.locator('table')).toHaveCount(0)

  const filaCategoria = page.locator('button[aria-expanded]', { hasText: nombreCategoria })
  await expect(filaCategoria).toContainText('-15,00 €')
  await expect(filaCategoria).toContainText('200,00 €')
  await filaCategoria.click()

  const filaSubcategoria = page.locator('button[aria-expanded]', { hasText: nombreSubcategoria })
  await expect(filaSubcategoria).toContainText('2 mov.')
  await filaSubcategoria.click()
  await expect(page.locator('table', { hasText: descripcionGasto })).toBeVisible()
  await expect(page.locator('table', { hasText: descripcionIngreso })).toBeVisible()

  await page.getByRole('button', { name: 'Ver todos los movimientos' }).click()
  await expect(page.locator('table')).toBeVisible()
  await expect(page.locator('tbody tr', { hasText: descripcionGasto })).toBeVisible()

  // Y se puede volver a la vista agrupada.
  await page.getByRole('button', { name: 'Agrupar por categoría' }).click()
  await expect(page.locator('button[aria-expanded]', { hasText: nombreCategoria })).toBeVisible()
})
