import { test, expect } from '@playwright/test'

test('gestión completa de un movimiento: crear, editar y eliminar', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV ${sufijo}`
  const nombreCategoria = `Categoría MOV ${sufijo}`
  const descripcion = `Movimiento E2E ${sufijo}`

  // Preparación: una cuenta y una categoría propias de este test.
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
  await page.getByLabel('Cuenta').click()
  await page.getByRole('option', { name: numeroCuenta }).click()
  await page.screenshot({ path: 'e2e/capturas/movimientos-01-listado-inicial.png' })

  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  await panel.locator('input[type="date"]').fill('2026-01-15')
  await panel.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
  await panel.getByPlaceholder('Descripción').fill(descripcion)
  await panel.getByPlaceholder('Importe').fill('-42.50')
  await panel.getByPlaceholder('Saldo').fill('957.50')
  await page.screenshot({ path: 'e2e/capturas/movimientos-02-formulario-relleno.png' })

  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  const fila = page.locator('tr', { hasText: descripcion })
  await expect(fila).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/movimientos-03-tras-crear.png' })

  await fila.getByRole('button', { name: 'Editar' }).click()
  await panel.getByPlaceholder('Importe').fill('-50.00')
  await panel.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('tr', { hasText: descripcion }).getByText('-50,00 €')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/movimientos-04-tras-editar.png' })

  await page
    .locator('tr', { hasText: descripcion })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('tr', { hasText: descripcion })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/movimientos-05-tras-eliminar.png' })
})
