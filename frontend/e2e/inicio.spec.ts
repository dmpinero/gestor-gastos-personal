import { test, expect } from '@playwright/test'

test('la página de inicio muestra el mensaje de bienvenida', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Gestor de Gastos Personal')
  await expect(page.locator('h2')).toHaveText('Bienvenido')
})
