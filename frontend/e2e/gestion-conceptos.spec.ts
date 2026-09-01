import { test, expect } from '@playwright/test'
import { elegirOpcion, elegirOpcionBuscador, seleccionarCuenta } from './utilidades'

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

  // Los conceptos sin asociar se agrupan por categoría y empiezan contraídos:
  // hay que expandir el grupo antes de poder pulsar el concepto, que prellena
  // el lado del resumen del formulario.
  await page.getByRole('button', { name: nombreCategoriaResumen }).click()
  await page.getByRole('button', { name: nombreCategoriaResumen, exact: true }).click()
  await elegirOpcionBuscador(
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

test('editar una asociación ya creada cambia la categoría real que usa el Resumen anual', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 EDITAR-ASOC ${sufijo}`
  const nombreCategoriaResumen = `Categoria RESUMEN-EDITAR ${sufijo}`
  const nombreCategoriaOriginal = `Categoria ORIGINAL-EDITAR ${sufijo}`
  const nombreCategoriaNueva = `Categoria NUEVA-EDITAR ${sufijo}`
  const anioActual = new Date().getFullYear()
  const fechaMovimiento = `${anioActual}-03-15`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  for (const nombre of [nombreCategoriaResumen, nombreCategoriaOriginal, nombreCategoriaNueva]) {
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    const panelCategoria = page.getByRole('dialog')
    await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombre)
    await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.locator('[data-slot="card"]', { hasText: nombre })).toBeVisible()
  }

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

  // Un movimiento en cada categoría candidata, con importes distintos para
  // poder distinguir sin ambigüedad cuál de las dos usa el Resumen anual.
  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)
  for (const [nombreCategoria, importe] of [
    [nombreCategoriaOriginal, '-150.00'],
    [nombreCategoriaNueva, '-90.00'],
  ] as const) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panelMovimiento = page.getByRole('dialog')
    await panelMovimiento.locator('input[type="date"]').fill(fechaMovimiento)
    await elegirOpcion(
      page,
      panelMovimiento.getByLabel('Categoría', { exact: true }),
      nombreCategoria,
    )
    const descripcionMovimiento = `Movimiento ${nombreCategoria}`
    await panelMovimiento.getByPlaceholder('Descripción').fill(descripcionMovimiento)
    await panelMovimiento.getByPlaceholder('Importe').fill(importe)
    await panelMovimiento.getByPlaceholder('Saldo').fill('1000.00')
    await panelMovimiento.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcionMovimiento })).toBeVisible()
  }

  // Crear la asociación apuntando primero a la categoría "original".
  await page.goto('/administracion/gestion-conceptos')
  await page.getByRole('button', { name: nombreCategoriaResumen }).click()
  await page.getByRole('button', { name: nombreCategoriaResumen, exact: true }).click()
  await elegirOpcionBuscador(
    page,
    page.getByLabel('Categoría real de Movimientos', { exact: true }),
    nombreCategoriaOriginal,
  )
  await page.getByRole('button', { name: 'Crear asociación' }).click()

  const filaAsociacion = page.locator('tbody tr', { hasText: nombreCategoriaResumen })
  await expect(filaAsociacion).toBeVisible()
  await expect(filaAsociacion).toContainText(nombreCategoriaOriginal)

  await page.goto('/resumen-anual')
  await expect(celdaMarzo).toContainText('-150,00 €')

  // Editar la asociación abre un panel modal (para no tener que desplazarse
  // hasta el formulario de creación, que está al principio de la página),
  // ya prellenado y con su propio botón "Guardar cambios".
  await page.goto('/administracion/gestion-conceptos')
  await filaAsociacion.getByRole('button', { name: 'Editar' }).click()
  const panelEdicion = page.getByRole('dialog')
  await expect(
    panelEdicion.getByRole('heading', { name: 'Editar asociación por categoría' }),
  ).toBeVisible()
  await expect(
    panelEdicion.getByLabel('Categoría real de Movimientos', { exact: true }),
  ).toHaveValue(nombreCategoriaOriginal)
  await elegirOpcionBuscador(
    page,
    panelEdicion.getByLabel('Categoría real de Movimientos', { exact: true }),
    nombreCategoriaNueva,
  )
  await panelEdicion.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(panelEdicion).toBeHidden()

  await expect(filaAsociacion).toContainText(nombreCategoriaNueva)
  await page.screenshot({ path: 'e2e/capturas/gestion-conceptos-03-asociacion-editada.png' })

  // El Resumen anual ahora usa el importe de la categoría nueva.
  await page.goto('/resumen-anual')
  await expect(celdaMarzo).toContainText('-90,00 €')
})

test('crear una asociación por descripción hace que el Resumen anual encuentre el importe real de un movimiento suelto', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 ASOCDESC ${sufijo}`
  const nombreCategoriaResumen = `Categoria IMPUESTOS-DESC ${sufijo}`
  const nombreCategoriaMovimiento = `Categoria OTRA-DESC ${sufijo}`
  const descripcionMovimiento = `Recibo Ayuntamiento Las Rozas ${sufijo}`
  const fragmentoDescripcion = `Ayuntamiento Las Rozas ${sufijo}`
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

  // Concepto previsto en el Resumen anual, con la categoría "Impuestos ...".
  await page.goto('/resumen-anual')
  await page.getByRole('button', { name: 'Añadir concepto' }).click()
  const panelConcepto = page.getByRole('dialog')
  await elegirOpcion(
    page,
    panelConcepto.getByLabel('Categoría', { exact: true }),
    nombreCategoriaResumen,
  )
  await panelConcepto.getByLabel('Importe previsto').fill('40.00')
  await panelConcepto.getByRole('button', { name: 'Añadir concepto' }).click()

  const filaConcepto = page.locator('tbody tr', { hasText: nombreCategoriaResumen })
  await expect(filaConcepto).toBeVisible()
  const celdaMarzo = filaConcepto.locator('td').nth(3)
  await expect(celdaMarzo).toContainText('-40,00 €')
  await expect(celdaMarzo).toHaveClass(/italic/) // previsto, sin movimiento real todavía

  // Movimiento suelto en una categoría distinta a la del concepto: no
  // comparte categoría con ningún otro movimiento, así que no se puede
  // asociar por categoría, solo por su descripción.
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
  await panelMovimiento.getByPlaceholder('Descripción').fill(descripcionMovimiento)
  await panelMovimiento.getByPlaceholder('Importe').fill('-40.00')
  await panelMovimiento.getByPlaceholder('Saldo').fill('1000.00')
  await panelMovimiento.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: descripcionMovimiento })).toBeVisible()

  // Sin asociación, el Resumen anual sigue mostrando solo el previsto.
  await page.goto('/resumen-anual')
  await expect(celdaMarzo).toContainText('-40,00 €')
  await expect(celdaMarzo).toHaveClass(/italic/)

  // Crear la asociación por descripción desde Gestión de conceptos.
  await page.goto('/administracion/gestion-conceptos')
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()

  await page.getByPlaceholder('p. ej. Ayuntamiento Las Rozas').fill(fragmentoDescripcion)
  await elegirOpcionBuscador(
    page,
    page.getByLabel('Categoría del Resumen anual (para esta descripción)', { exact: true }),
    nombreCategoriaResumen,
  )
  await page.getByRole('button', { name: 'Crear asociación' }).click()

  const filaAsociacionDescripcion = page.locator('tbody tr', { hasText: nombreCategoriaResumen })
  await expect(filaAsociacionDescripcion).toBeVisible()
  await expect(filaAsociacionDescripcion).toContainText(fragmentoDescripcion)
  await page.screenshot({ path: 'e2e/capturas/gestion-conceptos-02-asociacion-descripcion.png' })

  // Ahora el Resumen anual encuentra el importe real a través de la
  // descripción, aunque el movimiento esté en otra categoría.
  await page.goto('/resumen-anual')
  await expect(celdaMarzo).toContainText('-40,00 €')
  await expect(celdaMarzo).not.toHaveClass(/italic/)

  // Eliminar la asociación revierte el Resumen anual a la previsión.
  await page.goto('/administracion/gestion-conceptos')
  await filaAsociacionDescripcion.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(filaAsociacionDescripcion).toHaveCount(0)

  await page.goto('/resumen-anual')
  await expect(celdaMarzo).toContainText('-40,00 €')
  await expect(celdaMarzo).toHaveClass(/italic/)
})
