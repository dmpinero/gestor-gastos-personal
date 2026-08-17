import { test, expect } from '@playwright/test'

test('gestión completa de una cuenta bancaria: crear, editar y eliminar', async ({ page }) => {
  const numeroCuenta = `ES00 TEST ${Date.now()}`

  await page.goto('/cuentas')
  await page.screenshot({ path: 'e2e/capturas/cuentas-01-listado-inicial.png' })

  await page.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await page.getByPlaceholder('Alias').fill('Cuenta de prueba E2E')
  await page.screenshot({ path: 'e2e/capturas/cuentas-02-formulario-relleno.png' })

  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const fila = page.locator('tr', { hasText: numeroCuenta })
  await expect(fila).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/cuentas-03-tras-crear.png' })

  await fila.getByRole('button', { name: 'Editar' }).click()
  await page.getByPlaceholder('Alias').fill('Cuenta de prueba E2E (editada)')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('tr', { hasText: 'Cuenta de prueba E2E (editada)' })).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/cuentas-04-tras-editar.png' })

  await page
    .locator('tr', { hasText: numeroCuenta })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  const dialogo = page.getByRole('alertdialog')
  await expect(dialogo).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/cuentas-05-confirmar-eliminacion.png' })

  await dialogo.getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/cuentas-06-tras-eliminar.png' })
})
