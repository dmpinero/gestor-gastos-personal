import { test, expect } from '@playwright/test'

test('gestión completa de un movimiento: crear, editar y eliminar', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV ${sufijo}`
  const nombreCategoria = `Categoría MOV ${sufijo}`
  const descripcion = `Movimiento E2E ${sufijo}`

  // Preparación: una cuenta y una categoría propias de este test.
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
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await page.getByLabel('Cuenta').click()
  await page.getByRole('option', { name: numeroCuenta }).click()
  await page.screenshot({ path: 'e2e/capturas/movimientos-01-listado-inicial.png' })

  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  await panel.locator('input[type="date"]').fill('2026-01-15')
  await panel.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
  await panel.getByPlaceholder('Descripción').fill(descripcion)
  await panel.getByPlaceholder('Importe').fill('-42.50')
  await panel.getByPlaceholder('Saldo').fill('957.50')
  await page.screenshot({ path: 'e2e/capturas/movimientos-02-formulario-relleno.png' })

  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  const fila = page.locator('tr', { hasText: descripcion })
  await expect(fila).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/movimientos-03-tras-crear.png' })

  await fila.getByRole('button', { name: 'Editar' }).click()
  await panel.getByPlaceholder('Importe').fill('-50.00')
  await panel.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('tr', { hasText: descripcion }).getByText('-50,00 €')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/movimientos-04-tras-editar.png' })

  await page
    .locator('tr', { hasText: descripcion })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('tr', { hasText: descripcion })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/movimientos-05-tras-eliminar.png' })
})

test('la fecha se muestra en formato dd/mm/aaaa, y el buscador y las cabeceras ordenables funcionan', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-ORD ${sufijo}`
  const nombreCategoria = `Categoría MOV-ORD ${sufijo}`
  const descripcionA = `Movimiento Orden A ${sufijo}`
  const descripcionB = `Movimiento Orden B ${sufijo}`

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
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await page.getByLabel('Cuenta').click()
  await page.getByRole('option', { name: numeroCuenta }).click()

  for (const [descripcion, fecha, importe, saldo] of [
    [descripcionA, '2026-01-01', '-10.00', '990.00'],
    [descripcionB, '2026-01-02', '-20.00', '970.00'],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill(fecha)
    await panel.getByLabel('Categoría', { exact: true }).click()
    await page.getByRole('option', { name: nombreCategoria }).click()
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill(importe)
    await panel.getByPlaceholder('Saldo').fill(saldo)
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  await expect(page.locator('tr', { hasText: descripcionA })).toContainText('01/01/2026')
  await expect(page.locator('tr', { hasText: descripcionB })).toContainText('02/01/2026')

  const buscador = page.getByLabel('Buscar')
  await buscador.fill(descripcionA)
  await expect(page.locator('tr', { hasText: descripcionA })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionB })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/movimientos-06-buscador.png' })

  await buscador.fill(`Movimiento Orden`)
  await expect(page.locator('tbody tr').filter({ hasText: sufijo.toString() })).toHaveCount(2)

  const cabeceraDescripcion = page.getByRole('button', { name: 'Descripción' })
  await cabeceraDescripcion.click()
  await expect(page.locator('tbody tr').first()).toContainText(descripcionA)

  await cabeceraDescripcion.click()
  await expect(page.locator('tbody tr').first()).toContainText(descripcionB)
  await page.screenshot({ path: 'e2e/capturas/movimientos-07-ordenado.png' })
})

test('seleccionar varios movimientos y eliminarlos en bloque', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-BLOQUE ${sufijo}`
  const nombreCategoria = `Categoría MOV-BLOQUE ${sufijo}`
  const descripcionA = `Movimiento bloque A ${sufijo}`
  const descripcionB = `Movimiento bloque B ${sufijo}`

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
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await page.getByLabel('Cuenta').click()
  await page.getByRole('option', { name: numeroCuenta }).click()

  for (const [descripcion, fecha, importe, saldo] of [
    [descripcionA, '2026-01-01', '-10.00', '990.00'],
    [descripcionB, '2026-01-02', '-20.00', '970.00'],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill(fecha)
    await panel.getByLabel('Categoría', { exact: true }).click()
    await page.getByRole('option', { name: nombreCategoria }).click()
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill(importe)
    await panel.getByPlaceholder('Saldo').fill(saldo)
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  await page.locator('tr', { hasText: descripcionA }).getByRole('checkbox').click()
  await page.locator('tr', { hasText: descripcionB }).getByRole('checkbox').click()
  await expect(page.getByText('2 seleccionados')).toBeVisible()

  // Cancelar no debe eliminar nada ni perder la selección.
  await page.getByRole('button', { name: 'Eliminar seleccionados' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('tr', { hasText: descripcionA })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionB })).toBeVisible()
  await expect(page.getByText('2 seleccionados')).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar seleccionados' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()

  await expect(page.locator('tr', { hasText: descripcionA })).toHaveCount(0)
  await expect(page.locator('tr', { hasText: descripcionB })).toHaveCount(0)
})
