import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const RUTAS = [
  '/',
  '/gestion/cuentas',
  '/gestion/categorias',
  '/gestion/movimientos',
  '/importar',
  '/historial',
  '/resumen-anual',
]

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
