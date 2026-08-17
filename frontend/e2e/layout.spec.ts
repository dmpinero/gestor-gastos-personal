import { test, expect } from '@playwright/test'

test('el panel de navegación colapsa y expande, y resalta la sección activa', async ({ page }) => {
  await page.goto('/')
  await page.screenshot({ path: 'e2e/capturas/layout-01-sidebar-expandido.png' })

  await expect(page.getByRole('link', { name: 'Movimientos' })).toBeVisible()

  await page.goto('/movimientos')
  await expect(page.getByRole('link', { name: 'Movimientos' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  const botonColapsar = page.getByRole('button', { name: 'Contraer panel de navegación' })
  const botonExpandir = page.getByRole('button', { name: 'Expandir panel de navegación' })

  await botonColapsar.click()
  await expect(botonExpandir).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/layout-02-sidebar-colapsado.png' })

  await botonExpandir.click()
  await expect(botonColapsar).toBeVisible()
  await expect(page.getByRole('link', { name: 'Movimientos' })).toContainText('Movimientos')
})

test('el modo claro/oscuro se puede alternar y persiste tras recargar', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.screenshot({ path: 'e2e/capturas/layout-03-modo-claro.png' })

  await page.getByRole('switch').click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.screenshot({ path: 'e2e/capturas/layout-04-modo-oscuro.png' })

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.screenshot({ path: 'e2e/capturas/layout-05-persistencia-tema.png' })

  // Deja el tema como estaba para no afectar a otros tests de esta suite.
  await page.getByRole('switch').click()
})
