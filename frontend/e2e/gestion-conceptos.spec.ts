import { test, expect } from '@playwright/test'
import { elegirOpcion, seleccionarCuenta } from './utilidades'

test('crear una asociación hace que el Resumen anual encuentre el importe real en otra categoría', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 ASOC ${sufijo}`
  // Nombres deliberadamente distintos a cualquier categoría real (p. ej.
  // "Comida"/"Alimentación"), para no colisionar por prefijo con ellas en el
  // buscador por teclado del Select.
  const nombreCategoriaResumen = `Categoria RESUMEN-ASOC ${sufijo}`
  const nombreCategoriaMovimiento = `Categoria MOVIMIENTO-ASOC ${sufijo}`
  const anioActual = new Date().getFullYear()
  const fechaMovimiento = `${anioActual}-03-15`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  for (const nombre of [nombreCategoriaResumen, nombreCategoriaMovimiento]) {
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    const panelCategoria = page.getByRole('dialog')
    await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombre)
    await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.locator('[data-slot="card"]', { hasText: nombre })).toBeVisible()
  }

  // Concepto previsto en el Resumen anual, con la categoría "Comida ...".
  await page.goto('/resumen-anual')
  await page.getByRole('button', { name: 'Añadir concepto' }).click()
  const panelConcepto = page.getByRole('dialog')
  await elegirOpcion(
    page,
    panelConcepto.getByLabel('Categoría', { exact: true }),
    nombreCategoriaResumen,
  )
  await panelConcepto.getByLabel('Importe previsto').fill('200.00')
  await panelConcepto.getByRole('button', { name: 'Añadir concepto' }).click()

  const filaConcepto = page.locator('tbody tr', { hasText: nombreCategoriaResumen })
  await expect(filaConcepto).toBeVisible()
  const celdaMarzo = filaConcepto.locator('td').nth(3)
  await expect(celdaMarzo).toContainText('-200,00 €')
  await expect(celdaMarzo).toHaveClass(/italic/) // previsto, sin movimiento real todavía

  // Movimiento real bajo la categoría "Alimentación ...", distinta a la del concepto.
  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panelMovimiento = page.getByRole('dialog')
  await panelMovimiento.locator('input[type="date"]').fill(fechaMovimiento)
  await elegirOpcion(
    page,
    panelMovimiento.getByLabel('Categoría', { exact: true }),
    nombreCategoriaMovimiento,
  )
  const descripcionMovimiento = `Supermercado ${sufijo}`
  await panelMovimiento.getByPlaceholder('Descripción').fill(descripcionMovimiento)
  await panelMovimiento.getByPlaceholder('Importe').fill('-150.00')
  await panelMovimiento.getByPlaceholder('Saldo').fill('1000.00')
  await panelMovimiento.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: descripcionMovimiento })).toBeVisible()

  // Sin asociación, el Resumen anual sigue mostrando solo el previsto.
  await page.goto('/resumen-anual')
  await expect(celdaMarzo).toContainText('-200,00 €')
  await expect(celdaMarzo).toHaveClass(/italic/)

  // Crear la asociación desde Administración > Gestión de conceptos.
  await page.goto('/administracion/gestion-conceptos')
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()

  // El botón de "sin asociar" prellena el lado del resumen del formulario.
  await page.getByRole('button', { name: nombreCategoriaResumen, exact: true }).click()
  await elegirOpcion(
    page,
    page.getByLabel('Categoría real de Movimientos', { exact: true }),
    nombreCategoriaMovimiento,
  )
  await page.getByRole('button', { name: 'Crear asociación' }).click()

  const filaAsociacion = page.locator('tbody tr', { hasText: nombreCategoriaResumen })
  await expect(filaAsociacion).toBeVisible()
  await expect(filaAsociacion).toContainText(nombreCategoriaMovimiento)
  await page.screenshot({ path: 'e2e/capturas/gestion-conceptos-01-asociacion-creada.png' })

  // El concepto sin asociar ya no aparece en la lista de sugerencias.
  await expect(page.getByRole('button', { name: nombreCategoriaResumen, exact: true })).toHaveCount(
    0,
  )

  // Ahora el Resumen anual encuentra el importe real a través de la asociación.
  await page.goto('/resumen-anual')
  await expect(celdaMarzo).toContainText('-150,00 €')
  await expect(celdaMarzo).not.toHaveClass(/italic/)

  // Eliminar la asociación revierte el Resumen anual a la previsión.
  await page.goto('/administracion/gestion-conceptos')
  await filaAsociacion.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(filaAsociacion).toHaveCount(0)

  await page.goto('/resumen-anual')
  await expect(celdaMarzo).toContainText('-200,00 €')
  await expect(celdaMarzo).toHaveClass(/italic/)
})
