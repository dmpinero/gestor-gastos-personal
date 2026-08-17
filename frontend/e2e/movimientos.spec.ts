import { test, expect } from '@playwright/test'

test('gestión completa de un movimiento: crear, editar y eliminar', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV ${sufijo}`
  const nombreCategoria = `Categoría MOV ${sufijo}`
  const descripcion = `Movimiento E2E ${sufijo}`

  // Preparación: una cuenta y una categoría propias de este test.
  await page.goto('/cuentas')
  await page.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/categorias')
  await page.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  await expect(page.locator('li', { hasText: nombreCategoria })).toBeVisible()

  await page.goto('/movimientos')
  await page.getByLabel('Cuenta').selectOption({ label: numeroCuenta })
  await page.screenshot({ path: 'e2e/capturas/movimientos-01-listado-inicial.png' })

  await page.locator('input[type="date"]').fill('2026-01-15')
  await page.locator('select').nth(1).selectOption({ label: nombreCategoria })
  await page.getByPlaceholder('Descripción').fill(descripcion)
  await page.getByPlaceholder('Importe').fill('-42.50')
  await page.getByPlaceholder('Saldo').fill('957.50')
  await page.screenshot({ path: 'e2e/capturas/movimientos-02-formulario-relleno.png' })

  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const fila = page.locator('tr', { hasText: descripcion })
  await expect(fila).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/movimientos-03-tras-crear.png' })

  await fila.getByRole('button', { name: 'Editar' }).click()
  await page.getByPlaceholder('Importe').fill('-50.00')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('tr', { hasText: descripcion }).getByText('-50.00')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/movimientos-04-tras-editar.png' })

  await page
    .locator('tr', { hasText: descripcion })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  await expect(page.locator('tr', { hasText: descripcion })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/movimientos-05-tras-eliminar.png' })
})
