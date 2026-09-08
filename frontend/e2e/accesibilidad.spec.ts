import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const RUTAS = [
  '/',
  '/gestion/cuentas',
  '/gestion/categorias',
  '/movimientos',
  '/importar',
  '/historial',
  '/resumen-anual',
]

// El popover de driver.js tiene una animación de aparición (fade-in) de
// ~0.4s; auditar con axe-core mientras aún está en transición puede detectar
// un contraste transitorio insuficiente (opacidad intermedia), un falso
// positivo intermitente. Se espera a que la opacidad llegue a 1 de verdad.
async function esperarPopoverEstable(page: import('@playwright/test').Page): Promise<void> {
  const popover = page.locator('.driver-popover')
  await expect(popover).toBeVisible()
  await expect.poll(async () => popover.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
}

async function auditarPagina(page: import('@playwright/test').Page) {
  return (
    new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // El panel de Vue Devtools solo se inyecta en modo desarrollo y no forma
      // parte de la aplicación real; se excluye para no analizar una herramienta
      // de terceros ajena a nuestro código.
      .exclude('.vue-devtools__anchor-btn')
      .analyze()
  )
}

for (const ruta of RUTAS) {
  test(`${ruta || '/'} no tiene violaciones de accesibilidad en modo claro (WCAG 2.1 AA)`, async ({
    page,
  }) => {
    await page.goto(ruta)
    const resultado = await auditarPagina(page)
    expect(resultado.violations).toEqual([])
  })

  test(`${ruta || '/'} no tiene violaciones de accesibilidad en modo oscuro (WCAG 2.1 AA)`, async ({
    page,
  }) => {
    await page.goto(ruta)
    await page.getByRole('switch').click()
    const resultado = await auditarPagina(page)
    expect(resultado.violations).toEqual([])
  })
}

test('el manual de usuario interactivo no tiene violaciones de accesibilidad en modo claro (WCAG 2.1 AA)', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir el manual de usuario interactivo' }).click()
  await esperarPopoverEstable(page)
  const resultado = await auditarPagina(page)
  expect(resultado.violations).toEqual([])
})

test('el manual de usuario interactivo no tiene violaciones de accesibilidad en modo oscuro (WCAG 2.1 AA)', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('switch').click()
  await page.getByRole('button', { name: 'Abrir el manual de usuario interactivo' }).click()
  await esperarPopoverEstable(page)
  const resultado = await auditarPagina(page)
  expect(resultado.violations).toEqual([])
})

test('el tour de Movimientos no tiene violaciones de accesibilidad en modo claro (WCAG 2.1 AA)', async ({
  page,
}) => {
  await page.goto('/movimientos')
  await page.getByRole('button', { name: 'Abrir el manual de usuario interactivo' }).click()
  await esperarPopoverEstable(page)
  const resultado = await auditarPagina(page)
  expect(resultado.violations).toEqual([])
})

test('el tour de Movimientos no tiene violaciones de accesibilidad en modo oscuro (WCAG 2.1 AA)', async ({
  page,
}) => {
  await page.goto('/movimientos')
  await page.getByRole('switch').click()
  await page.getByRole('button', { name: 'Abrir el manual de usuario interactivo' }).click()
  await esperarPopoverEstable(page)
  const resultado = await auditarPagina(page)
  expect(resultado.violations).toEqual([])
})

test('el tour de Resumen anual no tiene violaciones de accesibilidad en modo claro (WCAG 2.1 AA)', async ({
  page,
}) => {
  await page.goto('/resumen-anual')
  await page.getByRole('button', { name: 'Abrir el manual de usuario interactivo' }).click()
  await esperarPopoverEstable(page)
  const resultado = await auditarPagina(page)
  expect(resultado.violations).toEqual([])
})

test('el tour de Resumen anual no tiene violaciones de accesibilidad en modo oscuro (WCAG 2.1 AA)', async ({
  page,
}) => {
  await page.goto('/resumen-anual')
  await page.getByRole('switch').click()
  await page.getByRole('button', { name: 'Abrir el manual de usuario interactivo' }).click()
  await esperarPopoverEstable(page)
  const resultado = await auditarPagina(page)
  expect(resultado.violations).toEqual([])
})
