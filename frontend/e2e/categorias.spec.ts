import { test, expect } from '@playwright/test'

test('gestión de categoría y subcategoría', async ({ page }) => {
  const nombreCategoria = `Categoría E2E ${Date.now()}`
  const nombreCategoriaEditada = `Categoría E2E editada ${Date.now()}`
  const nombreSubcategoria = `Subcategoría E2E ${Date.now()}`

  await page.goto('/gestion/categorias')
  await page.screenshot({ path: 'e2e/capturas/categorias-01-listado-inicial.png' })

  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  await panel.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panel.getByRole('button', { name: 'Crear categoría' }).click()

  const tarjetaCategoria = page.locator('[data-slot="card"]', { hasText: nombreCategoria })
  await expect(tarjetaCategoria).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/categorias-02-tras-crear-categoria.png' })

  await tarjetaCategoria.getByRole('button', { name: 'Editar' }).click()
  await panel.getByPlaceholder('Nueva categoría').fill(nombreCategoriaEditada)
  await panel.getByRole('button', { name: 'Guardar cambios' }).click()
  const tarjetaCategoriaEditada = page.locator('[data-slot="card"]', {
    hasText: nombreCategoriaEditada,
  })
  await expect(tarjetaCategoriaEditada).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/categorias-03-tras-editar-categoria.png' })

  await tarjetaCategoriaEditada.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaCategoriaEditada.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaCategoriaEditada.locator('li', { hasText: nombreSubcategoria })).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/categorias-04-tras-crear-subcategoria.png' })

  await tarjetaCategoriaEditada
    .locator('li', { hasText: nombreSubcategoria })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(tarjetaCategoriaEditada.locator('li', { hasText: nombreSubcategoria })).toHaveCount(
    0,
  )

  await tarjetaCategoriaEditada.getByRole('button', { name: 'Eliminar categoría' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaEditada })).toHaveCount(
    0,
  )
  await page.screenshot({ path: 'e2e/capturas/categorias-05-tras-eliminar.png' })
})

test('eliminar una subcategoría con movimientos asociados la borra en cascada al confirmarlo', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 CAT-CASCADA ${sufijo}`
  const nombreCategoria = `Categoría CAT-CASCADA ${sufijo}`
  const nombreSubcategoria = `Subcategoría CAT-CASCADA ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoria = page.getByRole('dialog')
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  const tarjetaCategoria = page.locator('[data-slot="card"]', { hasText: nombreCategoria })
  await expect(tarjetaCategoria).toBeVisible()

  await tarjetaCategoria.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaCategoria.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaCategoria.locator('li', { hasText: nombreSubcategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await page.getByLabel('Cuenta').click()
  await page.getByRole('option', { name: numeroCuenta }).click()
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panelMovimiento = page.getByRole('dialog')
  await panelMovimiento.locator('input[type="date"]').fill('2026-01-01')
  await panelMovimiento.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
  await panelMovimiento.getByLabel('Subcategoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreSubcategoria }).click()
  await panelMovimiento.getByPlaceholder('Descripción').fill('Movimiento subcategoría cascada')
  await panelMovimiento.getByPlaceholder('Importe').fill('-8.00')
  await panelMovimiento.getByPlaceholder('Saldo').fill('92.00')
  await panelMovimiento.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: 'Movimiento subcategoría cascada' })).toBeVisible()

  await page.goto('/gestion/categorias')
  await tarjetaCategoria
    .locator('li', { hasText: nombreSubcategoria })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  const dialogo = page.getByRole('alertdialog')
  await expect(dialogo).toContainText('También se eliminarán: 1 movimiento.')

  await dialogo.getByRole('button', { name: 'Eliminar' }).click()
  await expect(tarjetaCategoria.locator('li', { hasText: nombreSubcategoria })).toHaveCount(0)
})

test('eliminar una categoría con subcategorías y movimientos asociados los borra en cascada al confirmarlo', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 CAT-CASCADA2 ${sufijo}`
  const nombreCategoria = `Categoría CAT-CASCADA2 ${sufijo}`
  const nombreSubcategoria = `Subcategoría CAT-CASCADA2 ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoria = page.getByRole('dialog')
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  const tarjetaCategoria = page.locator('[data-slot="card"]', { hasText: nombreCategoria })
  await expect(tarjetaCategoria).toBeVisible()

  await tarjetaCategoria.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaCategoria.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaCategoria.locator('li', { hasText: nombreSubcategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await page.getByLabel('Cuenta').click()
  await page.getByRole('option', { name: numeroCuenta }).click()
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panelMovimiento = page.getByRole('dialog')
  await panelMovimiento.locator('input[type="date"]').fill('2026-01-01')
  await panelMovimiento.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
  await panelMovimiento.getByPlaceholder('Descripción').fill('Movimiento categoría cascada')
  await panelMovimiento.getByPlaceholder('Importe').fill('-6.00')
  await panelMovimiento.getByPlaceholder('Saldo').fill('94.00')
  await panelMovimiento.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: 'Movimiento categoría cascada' })).toBeVisible()

  await page.goto('/gestion/categorias')
  await tarjetaCategoria.getByRole('button', { name: 'Eliminar categoría' }).click()
  const dialogo = page.getByRole('alertdialog')
  await expect(dialogo).toContainText('También se eliminarán: 1 subcategoría, 1 movimiento.')

  await dialogo.getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toHaveCount(0)
})
