import { test, expect } from '@playwright/test'

const BOTON_AYUDA = 'Abrir el manual de usuario interactivo'

test('recargar la aplicación no lanza el tour automáticamente', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('dialog', { name: 'Dashboard' })).not.toBeVisible()
})

test('pulsar el icono de ayuda lanza el tour y resalta el primer paso', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: BOTON_AYUDA }).click()

  const popover = page.getByRole('dialog', { name: 'Dashboard' })
  await expect(popover).toBeVisible()
  await expect(popover).toContainText('Dashboard')
  await page.screenshot({ path: 'e2e/capturas/manual-usuario-01-primer-paso.png' })
})

test('recorre en orden las secciones, el tema y el icono de ayuda', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: BOTON_AYUDA }).click()

  const titulos = [
    'Dashboard',
    'Gestión',
    'Importar',
    'Historial',
    'Resumen anual',
    'Administración',
    'Tema claro/oscuro',
    'Ayuda',
  ]

  for (const [indice, titulo] of titulos.entries()) {
    await expect(page.getByRole('dialog').locator('header')).toHaveText(titulo)
    if (indice < titulos.length - 1) {
      await page.getByRole('button', { name: 'Siguiente' }).click()
    }
  }
  await page.screenshot({ path: 'e2e/capturas/manual-usuario-02-ultimo-paso.png' })
})

test('el botón "Anterior" retrocede al paso previo', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: BOTON_AYUDA }).click()

  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page.getByRole('dialog').locator('header')).toHaveText('Gestión')

  await page.getByRole('button', { name: 'Anterior' }).click()
  await expect(page.getByRole('dialog').locator('header')).toHaveText('Dashboard')
})

test('cerrar con el botón de cerrar oculta el tour', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: BOTON_AYUDA }).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  await page.getByRole('button', { name: 'Cerrar' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
})

test('cerrar con la tecla Escape oculta el tour igual que el botón', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: BOTON_AYUDA }).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog')).toBeHidden()
})

test('el tour se recorre por completo solo con el teclado', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: BOTON_AYUDA }).click()

  await page.getByRole('button', { name: 'Siguiente' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog').locator('header')).toHaveText('Gestión')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})
