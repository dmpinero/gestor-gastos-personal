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

test('el buscador filtra las categorías por su nombre o el de sus subcategorías', async ({
  page,
}) => {
  const sufijo = Date.now()
  const nombreCategoriaA = `Categoría BUSCA-A ${sufijo}`
  const nombreCategoriaB = `Categoría BUSCA-B ${sufijo}`
  const nombreSubcategoria = `Subcategoría BUSCA ${sufijo}`

  await page.goto('/gestion/categorias')

  for (const nombre of [nombreCategoriaA, nombreCategoriaB]) {
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    const panel = page.getByRole('dialog')
    await panel.getByPlaceholder('Nueva categoría').fill(nombre)
    await panel.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.locator('[data-slot="card"]', { hasText: nombre })).toBeVisible()
  }

  const tarjetaB = page.locator('[data-slot="card"]', { hasText: nombreCategoriaB })
  await tarjetaB.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaB.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaB.locator('li', { hasText: nombreSubcategoria })).toBeVisible()

  const buscador = page.getByLabel('Buscar')
  await buscador.fill(`BUSCA-A ${sufijo}`)
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaA })).toBeVisible()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaB })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/categorias-06-buscador.png' })

  // Buscar por el nombre de una subcategoría también encuentra su categoría.
  await buscador.fill(nombreSubcategoria)
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaB })).toBeVisible()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaA })).toHaveCount(0)
})

test('editar una subcategoría cambia su nombre y su categoría, actualizando los movimientos existentes', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 SUBCAT ${sufijo}`
  const nombreCategoriaOrigen = `Categoría SUBCAT-ORIGEN ${sufijo}`
  const nombreCategoriaDestino = `Categoría SUBCAT-DESTINO ${sufijo}`
  const nombreSubcategoria = `Subcategoría SUBCAT ${sufijo}`
  const nombreSubcategoriaEditada = `Subcategoría SUBCAT editada ${sufijo}`
  const descripcionMovimiento = `Movimiento SUBCAT ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  for (const nombre of [nombreCategoriaOrigen, nombreCategoriaDestino]) {
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    const panelCategoria = page.getByRole('dialog')
    await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombre)
    await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.locator('[data-slot="card"]', { hasText: nombre })).toBeVisible()
  }

  const tarjetaOrigen = page.locator('[data-slot="card"]', { hasText: nombreCategoriaOrigen })
  const tarjetaDestino = page.locator('[data-slot="card"]', { hasText: nombreCategoriaDestino })
  await tarjetaOrigen.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaOrigen.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaOrigen.locator('li', { hasText: nombreSubcategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await page.getByLabel('Cuenta', { exact: true }).click()
  await page.getByRole('option', { name: numeroCuenta }).click()
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panelMovimiento = page.getByRole('dialog')
  await panelMovimiento.locator('input[type="date"]').fill('2026-01-01')
  await panelMovimiento.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoriaOrigen }).click()
  await panelMovimiento.getByLabel('Subcategoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreSubcategoria }).click()
  await panelMovimiento.getByPlaceholder('Descripción').fill(descripcionMovimiento)
  await panelMovimiento.getByPlaceholder('Importe').fill('-12.00')
  await panelMovimiento.getByPlaceholder('Saldo').fill('88.00')
  await panelMovimiento.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: descripcionMovimiento })).toBeVisible()

  await page.goto('/gestion/categorias')
  await tarjetaOrigen
    .locator('li', { hasText: nombreSubcategoria })
    .getByRole('button', { name: 'Editar' })
    .click()
  const panelSubcategoria = page.getByRole('dialog')
  await panelSubcategoria
    .getByPlaceholder('Nombre de la subcategoría')
    .fill(nombreSubcategoriaEditada)
  await panelSubcategoria.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoriaDestino }).click()
  await panelSubcategoria.getByRole('button', { name: 'Guardar cambios' }).click()

  await expect(tarjetaOrigen.locator('li', { hasText: nombreSubcategoriaEditada })).toHaveCount(0)
  await expect(tarjetaDestino.locator('li', { hasText: nombreSubcategoriaEditada })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await page.getByLabel('Cuenta', { exact: true }).click()
  await page.getByRole('option', { name: numeroCuenta }).click()
  const filaMovimiento = page.locator('tr', { hasText: descripcionMovimiento })
  await expect(filaMovimiento).toContainText(nombreCategoriaDestino)
  await expect(filaMovimiento).toContainText(nombreSubcategoriaEditada)
})

test('seleccionar varias categorías y eliminarlas en bloque', async ({ page }) => {
  const sufijo = Date.now()
  const nombreCategoriaA = `Categoría BLOQUE-A ${sufijo}`
  const nombreCategoriaB = `Categoría BLOQUE-B ${sufijo}`

  await page.goto('/gestion/categorias')

  for (const nombre of [nombreCategoriaA, nombreCategoriaB]) {
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    const panel = page.getByRole('dialog')
    await panel.getByPlaceholder('Nueva categoría').fill(nombre)
    await panel.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.locator('[data-slot="card"]', { hasText: nombre })).toBeVisible()
  }

  await page
    .locator('[data-slot="card"]', { hasText: nombreCategoriaA })
    .getByRole('checkbox')
    .click()
  await page
    .locator('[data-slot="card"]', { hasText: nombreCategoriaB })
    .getByRole('checkbox')
    .click()
  await expect(page.getByText('2 seleccionados')).toBeVisible()

  // Cancelar no debe eliminar nada ni perder la selección.
  await page.getByRole('button', { name: 'Eliminar seleccionados' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaA })).toBeVisible()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaB })).toBeVisible()
  await expect(page.getByText('2 seleccionados')).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar seleccionados' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()

  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaA })).toHaveCount(0)
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaB })).toHaveCount(0)
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
