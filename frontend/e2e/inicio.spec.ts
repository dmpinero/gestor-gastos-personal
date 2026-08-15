import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('la página de inicio muestra el mensaje de bienvenida', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Gestor de Gastos Personal')
  await expect(page.locator('h2')).toHaveText('Bienvenido')
})

test('la página de inicio no tiene violaciones de accesibilidad (WCAG 2.1 AA)', async ({
  page,
}) => {
  await page.goto('/')

  const resultadoAnalisis = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // El panel de Vue Devtools solo se inyecta en modo desarrollo y no forma
    // parte de la aplicación real; se excluye para no analizar una herramienta
    // de terceros ajena a nuestro código.
    .exclude('.vue-devtools__anchor-btn')
    .analyze()

  expect(resultadoAnalisis.violations).toEqual([])
})
