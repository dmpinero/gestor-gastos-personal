import { test, expect } from '@playwright/test'

const BOTON_AYUDA = 'Abrir el manual de usuario interactivo'

test('recargar la aplicación no lanza el tour automáticamente', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('dialog', { name: 'Dashboard' })).toBeHidden()
})

test('pulsar el icono de ayuda lanza el tour y resalta la sección activa del menú', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('button', { name: BOTON_AYUDA }).click()

  const popover = page.getByRole('dialog', { name: 'Dashboard' })
  await expect(popover).toBeVisible()
  await expect(popover).toContainText('Dashboard')
  await page.screenshot({ path: 'e2e/capturas/manual-usuario-01-primer-paso.png' })
})

test('en el Dashboard, tras la orientación recorre sus tarjetas y termina con tema y ayuda', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 TOUR-DASHBOARD ${sufijo}`

  // Se crea una cuenta para que el paso "Saldo por cuenta" tenga un
  // elemento real que resaltar (si no hay cuentas, ese paso se omite).
  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: BOTON_AYUDA }).click()

  const titulos = [
    'Dashboard',
    'Saldo global',
    'Saldo por cuenta',
    'Gastos por categoría',
    'Ingresos por categoría',
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
  await expect(page.getByRole('dialog').locator('header')).toHaveText('Saldo global')

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
  await expect(page.getByRole('dialog').locator('header')).toHaveText('Saldo global')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})
