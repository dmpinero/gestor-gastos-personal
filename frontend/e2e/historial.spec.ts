import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function crearMovimiento(
  page: Page,
  numeroCuenta: string,
  nombreCategoria: string,
  subcategoria: string | null,
  descripcion: string,
  importe: string,
): Promise<void> {
  await page.getByLabel('Cuenta', { exact: true }).click()
  await page.getByRole('option', { name: numeroCuenta }).click()
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill('2026-01-01')
  await panel.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
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
  await panel.getByLabel('Subcategoría', { exact: true }).click()
  await page.getByRole('option', { name: subcategoria }).click()
}

test('sin selección muestra un mensaje para elegir categoría o subcategoría', async ({ page }) => {
  await page.goto('/historial')
  await expect(
    page.getByText(
      'Selecciona una categoría o subcategoría en el menú lateral para ver su evolución.',
    ),
  ).toBeVisible()
})

test('navegar por categoría y subcategoría en el historial muestra solo los gastos, cruzando cuentas', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuentaA = `ES00 HIST-A ${sufijo}`
  const numeroCuentaB = `ES00 HIST-B ${sufijo}`
  const nombreCategoria = `Categoría HIST ${sufijo}`
  const nombreSubcategoria = `Subcategoría HIST ${sufijo}`
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

  const filas = page.locator('tbody tr')
  await expect(filas.filter({ hasText: descripcionGastoA })).toBeVisible()
  await expect(filas.filter({ hasText: descripcionGastoB })).toBeVisible()
  await expect(filas.filter({ hasText: descripcionGastoSub })).toBeVisible()
  await expect(filas.filter({ hasText: descripcionIngreso })).toHaveCount(0)
  await expect(filas.filter({ hasText: descripcionGastoA })).toContainText(numeroCuentaA)
  await expect(filas.filter({ hasText: descripcionGastoB })).toContainText(numeroCuentaB)

  // Resumen: 15 + 25 + 8 = 48 € gastados en 3 movimientos.
  const tarjetaTotalGastado = page.locator('[data-slot="card"]', { hasText: 'Total gastado' })
  const tarjetaMovimientos = page.locator('[data-slot="card"]', { hasText: 'Movimientos' })
  await expect(tarjetaTotalGastado).toContainText('-48,00 €')
  await expect(tarjetaMovimientos).toContainText('3')
  await page.screenshot({ path: 'e2e/capturas/historial-01-categoria.png' })

  // Filtrar por mes: enero (el mes de los movimientos creados) los mantiene.
  await page.getByLabel('Mes', { exact: true }).click()
  await page.getByRole('option', { name: 'Enero' }).click()
  await expect(filas.filter({ hasText: descripcionGastoA })).toBeVisible()
  await expect(tarjetaTotalGastado).toContainText('-48,00 €')

  // Filtrar por un mes sin movimientos: la tabla y el resumen quedan a cero.
  await page.getByLabel('Mes', { exact: true }).click()
  await page.getByRole('option', { name: 'Febrero' }).click()
  await expect(filas.filter({ hasText: descripcionGastoA })).toHaveCount(0)
  await expect(tarjetaTotalGastado).toContainText('0,00 €')
  await expect(tarjetaMovimientos).toContainText('0')
  await expect(page.getByText(`No hay gastos registrados para ${nombreCategoria}.`)).toBeVisible()

  // Volver a "Todos los meses" restaura los datos.
  await page.getByLabel('Mes', { exact: true }).click()
  await page.getByRole('option', { name: 'Todos los meses' }).click()
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
