import { test, expect } from '@playwright/test'
import { elegirOpcion, seleccionarCuenta } from './utilidades'

test('la página de inicio muestra el panel principal con saldos y totales por categoría', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 DASH ${sufijo}`
  const nombreCategoriaGasto = `Categoria gasto ${sufijo}`
  const nombreCategoriaIngreso = `Categoria ingreso ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  for (const nombreCategoria of [nombreCategoriaGasto, nombreCategoriaIngreso]) {
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    const panelCategoria = page.getByRole('dialog')
    await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
    await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()
  }

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  let panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill('2026-01-01')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoriaGasto)
  await panel.getByPlaceholder('Descripción').fill('Gasto de prueba')
  await panel.getByPlaceholder('Importe').fill('-30.00')
  await panel.getByPlaceholder('Saldo').fill('970.00')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: 'Gasto de prueba' })).toBeVisible()

  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill('2026-01-02')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoriaIngreso)
  await panel.getByPlaceholder('Descripción').fill('Ingreso de prueba')
  await panel.getByPlaceholder('Importe').fill('1500.00')
  await panel.getByPlaceholder('Saldo').fill('2470.00')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: 'Ingreso de prueba' })).toBeVisible()

  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Gestor de Gastos Personal')
  await expect(page.getByText('Saldo global')).toBeVisible()

  // El saldo global agrega TODAS las cuentas existentes (no solo la creada en
  // este test), así que se comprueba la tarjeta de la cuenta propia en vez de
  // un valor global exacto, para no depender del resto de datos ya cargados.
  const tarjetaCuenta = page.locator('[data-slot="card"]', { hasText: numeroCuenta })
  await expect(tarjetaCuenta).toBeVisible()
  await expect(tarjetaCuenta).toContainText('2470,00 €')

  const filaGasto = page.locator('li', { hasText: nombreCategoriaGasto })
  await expect(filaGasto).toContainText('-30,00 €')

  const filaIngreso = page.locator('li', { hasText: nombreCategoriaIngreso })
  await expect(filaIngreso).toContainText('1500,00 €')

  await page.screenshot({ path: 'e2e/capturas/inicio-01-panel-principal.png' })
})
