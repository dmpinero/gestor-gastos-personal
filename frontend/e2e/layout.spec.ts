import { test, expect } from '@playwright/test'
import { elegirOpcion, seleccionarCuenta } from './utilidades'

test('el panel de navegación colapsa y expande, y resalta la sección activa', async ({ page }) => {
  await page.goto('/')
  await page.screenshot({ path: 'e2e/capturas/layout-01-sidebar-expandido.png' })

  await expect(page.getByRole('link', { name: 'Gestión' })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await expect(page.getByRole('link', { name: 'Gestión' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
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
  await expect(page.getByRole('link', { name: 'Gestión' })).toContainText('Gestión')
})

test('Importar es un acceso de primer nivel independiente de Gestión', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Importar' })).toBeVisible()

  await page.getByRole('link', { name: 'Importar' }).click()
  await expect(page).toHaveURL(/\/importar$/)
  await expect(page.getByRole('link', { name: 'Importar' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('link', { name: 'Gestión' })).not.toHaveAttribute(
    'aria-current',
    'page',
  )
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

test('cambiar de pestaña en Gestión muestra los datos reales de esa sección', async ({ page }) => {
  await page.goto('/gestion/cuentas')
  await expect(page.getByRole('tab', { name: 'Cuentas' })).toHaveAttribute('data-state', 'active')

  await page.getByRole('tab', { name: 'Movimientos' }).click()
  await expect(page).toHaveURL(/\/gestion\/movimientos$/)
  await expect(page.getByRole('tab', { name: 'Movimientos' })).toHaveAttribute(
    'data-state',
    'active',
  )
  await expect(page.getByLabel('Cuenta')).toBeVisible()
})

test('recargar la página mantiene la pestaña activa de Gestión', async ({ page }) => {
  await page.goto('/gestion/categorias')
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Categorías' })).toHaveAttribute(
    'data-state',
    'active',
  )
  await expect(page.getByRole('button', { name: 'Crear categoría' })).toBeVisible()
})

test('cerrar el panel de creación sin guardar no modifica el listado', async ({ page }) => {
  await page.goto('/gestion/cuentas')
  const filasAntes = await page.locator('tbody tr').count()

  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panel = page.getByRole('dialog')
  await panel.getByPlaceholder('Número de cuenta').fill('ES00 NO SE GUARDA')
  await panel.getByRole('button', { name: 'Cancelar' }).click()
  await expect(panel).toBeHidden()

  await expect(page.locator('tbody tr')).toHaveCount(filasAntes)
  await expect(page.locator('tr', { hasText: 'ES00 NO SE GUARDA' })).toHaveCount(0)
})

test('en el menú de Historial, el icono de cada categoría es rojo si es de gasto y verde si es de ingreso', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 HISTCOL ${sufijo}`
  const categoriaGasto = `Categoria HISTCOL GASTO ${sufijo}`
  const categoriaIngreso = `Categoria HISTCOL INGRESO ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  for (const nombreCategoria of [categoriaGasto, categoriaIngreso]) {
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    const panelCategoria = page.getByRole('dialog')
    await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
    await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()
  }

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)
  for (const [nombreCategoria, importe] of [
    [categoriaGasto, '-30.00'],
    [categoriaIngreso, '30.00'],
  ] as const) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await expect(panel).toBeVisible()
    await panel.locator('input[type="date"]').fill('2026-01-15')
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await panel.getByPlaceholder('Descripción').fill(`Movimiento ${nombreCategoria}`)
    await panel.getByPlaceholder('Importe').fill(importe)
    await panel.getByPlaceholder('Saldo').fill('100.00')
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: nombreCategoria })).toBeVisible()
  }

  // El menú lateral carga los totales de /dashboard/resumen una sola vez al
  // montarse; recargar la página fuerza a que recoja los movimientos recién
  // creados.
  await page.goto('/historial')
  await page.reload()
  const enlaceGasto = page.getByRole('link', { name: categoriaGasto })
  const enlaceIngreso = page.getByRole('link', { name: categoriaIngreso })
  await expect(enlaceGasto).toBeVisible()
  await expect(enlaceIngreso).toBeVisible()
  await expect(enlaceGasto.locator('svg').first()).toHaveClass(/text-destructive/)
  await expect(enlaceIngreso.locator('svg').first()).toHaveClass(/text-success/)
})

test('la barra de estado muestra la versión y abre el historial de cambios', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/^v\d+\.\d+\.\d+$/)).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/layout-06-barra-estado.png' })

  await page.getByRole('button', { name: 'Ver historial de cambios' }).click()
  const modal = page.getByRole('dialog', { name: 'Historial de cambios' })
  await expect(modal).toBeVisible()
  await expect(modal).toContainText(/\d+\.\d+\.\d+/)
  await page.screenshot({ path: 'e2e/capturas/layout-07-modal-changelog.png' })
})
