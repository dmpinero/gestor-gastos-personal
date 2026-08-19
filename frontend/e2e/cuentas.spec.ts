import { test, expect } from '@playwright/test'

test('gestión completa de una cuenta bancaria: crear, editar y eliminar', async ({ page }) => {
  const numeroCuenta = `ES00 TEST ${Date.now()}`

  await page.goto('/gestion/cuentas')
  await page.screenshot({ path: 'e2e/capturas/cuentas-01-listado-inicial.png' })

  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  await panel.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panel.getByPlaceholder('Alias').fill('Cuenta de prueba E2E')
  await page.screenshot({ path: 'e2e/capturas/cuentas-02-formulario-relleno.png' })

  await panel.getByRole('button', { name: 'Crear cuenta' }).click()
  const fila = page.locator('tr', { hasText: numeroCuenta })
  await expect(fila).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/cuentas-03-tras-crear.png' })

  await fila.getByRole('button', { name: 'Editar' }).click()
  await panel.getByPlaceholder('Alias').fill('Cuenta de prueba E2E (editada)')
  await panel.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('tr', { hasText: 'Cuenta de prueba E2E (editada)' })).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/cuentas-04-tras-editar.png' })

  await page
    .locator('tr', { hasText: numeroCuenta })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  const dialogo = page.getByRole('alertdialog')
  await expect(dialogo).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/cuentas-05-confirmar-eliminacion.png' })

  await dialogo.getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/cuentas-06-tras-eliminar.png' })
})

test('seleccionar varias cuentas y eliminarlas en bloque', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuentaA = `ES00 BLOQUE-A ${sufijo}`
  const numeroCuentaB = `ES00 BLOQUE-B ${sufijo}`

  await page.goto('/gestion/cuentas')

  for (const numero of [numeroCuentaA, numeroCuentaB]) {
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const panel = page.getByRole('dialog')
    await panel.getByPlaceholder('Número de cuenta').fill(numero)
    await panel.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.locator('tr', { hasText: numero })).toBeVisible()
  }

  await page.locator('tr', { hasText: numeroCuentaA }).getByRole('checkbox').click()
  await page.locator('tr', { hasText: numeroCuentaB }).getByRole('checkbox').click()
  await expect(page.getByText('2 seleccionados')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/cuentas-07-seleccion-multiple.png' })

  // Cancelar no debe eliminar nada ni perder la selección.
  await page.getByRole('button', { name: 'Eliminar seleccionados' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('tr', { hasText: numeroCuentaA })).toBeVisible()
  await expect(page.locator('tr', { hasText: numeroCuentaB })).toBeVisible()
  await expect(page.getByText('2 seleccionados')).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar seleccionados' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()

  await expect(page.locator('tr', { hasText: numeroCuentaA })).toHaveCount(0)
  await expect(page.locator('tr', { hasText: numeroCuentaB })).toHaveCount(0)
})

test('el buscador filtra las cuentas y las cabeceras permiten ordenar', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuentaA = `ES00 ORDEN-A ${sufijo}`
  const numeroCuentaB = `ES00 ORDEN-B ${sufijo}`

  await page.goto('/gestion/cuentas')

  for (const numero of [numeroCuentaA, numeroCuentaB]) {
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const panel = page.getByRole('dialog')
    await panel.getByPlaceholder('Número de cuenta').fill(numero)
    await panel.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.locator('tr', { hasText: numero })).toBeVisible()
  }

  const buscador = page.getByLabel('Buscar')
  await buscador.fill(`ORDEN-A ${sufijo}`)
  await expect(page.locator('tr', { hasText: numeroCuentaA })).toBeVisible()
  await expect(page.locator('tr', { hasText: numeroCuentaB })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/cuentas-08-buscador.png' })

  await buscador.fill(sufijo.toString())
  await expect(page.locator('tbody tr')).toHaveCount(2)

  const cabeceraNumeroCuenta = page.getByRole('button', { name: 'Número de cuenta' })
  await cabeceraNumeroCuenta.click()
  await expect(page.locator('tbody tr').first()).toContainText(numeroCuentaA)

  await cabeceraNumeroCuenta.click()
  await expect(page.locator('tbody tr').first()).toContainText(numeroCuentaB)
  await page.screenshot({ path: 'e2e/capturas/cuentas-09-ordenado.png' })
})

test('eliminar una cuenta con movimientos asociados los borra en cascada al confirmarlo', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 CASCADA ${sufijo}`
  const nombreCategoria = `Categoría CASCADA ${sufijo}`

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
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panelMovimiento = page.getByRole('dialog')
  await panelMovimiento.locator('input[type="date"]').fill('2026-01-01')
  await panelMovimiento.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
  await panelMovimiento.getByPlaceholder('Descripción').fill('Movimiento cascada')
  await panelMovimiento.getByPlaceholder('Importe').fill('-10.00')
  await panelMovimiento.getByPlaceholder('Saldo').fill('90.00')
  await panelMovimiento.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: 'Movimiento cascada' })).toBeVisible()

  await page.goto('/gestion/cuentas')
  await page
    .locator('tr', { hasText: numeroCuenta })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  const dialogo = page.getByRole('alertdialog')
  await expect(dialogo).toBeVisible()
  await expect(dialogo).toContainText('También se eliminarán: 1 movimiento.')
  await page.screenshot({ path: 'e2e/capturas/cuentas-10-confirmar-cascada.png' })

  await dialogo.getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toHaveCount(0)
  await expect(page.getByText(/No se puede eliminar/)).toHaveCount(0)
})
