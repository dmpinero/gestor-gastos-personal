import { test, expect, type Page, type Locator } from '@playwright/test'

async function crearMovimiento(
  page: Page,
  numeroCuenta: string,
  nombreCategoria: string,
  subcategoria: string | null,
  descripcion: string,
  importe: string,
  fecha: string,
): Promise<void> {
  await page.getByLabel('Cuenta', { exact: true }).click()
  await page.getByRole('option', { name: numeroCuenta }).click()
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill(fecha)
  await panel.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
  if (subcategoria) {
    await panel.getByLabel('Subcategoría', { exact: true }).click()
    await page.getByRole('option', { name: subcategoria }).click()
  }
  await panel.getByPlaceholder('Descripción').fill(descripcion)
  await panel.getByPlaceholder('Importe').fill(importe)
  await panel.getByPlaceholder('Saldo').fill('1000.00')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
}

function celdaMes(fila: Locator, mesNumero: number): Locator {
  return fila.locator('td').nth(mesNumero)
}

test('crear, editar y eliminar conceptos previstos, combinando importes reales y previstos', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 RESU ${sufijo}`
  const nombreCategoria = `Categoría RESU ${sufijo}`
  const nombreSubcategoria = `Subcategoría RESU ${sufijo}`
  const descripcionMovimiento = `Gasto mensual ${sufijo}`

  const hoy = new Date()
  const anioActual = hoy.getFullYear()
  const mesActualNumero = hoy.getMonth() + 1
  const fechaMovimiento = `${anioActual}-${String(mesActualNumero).padStart(2, '0')}-15`

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

  // Concepto mensual sobre la subcategoría, con un importe previsto de -50 €.
  // El Tipo por defecto es "Gasto", y el importe se escribe en positivo: el
  // signo lo aplica el formulario según el Tipo elegido (regresión del bug
  // donde un importe positivo terminaba siempre en Ingresos).
  await page.goto('/resumen-anual')
  await page.getByRole('button', { name: 'Añadir concepto' }).click()
  const panelConcepto = page.getByRole('dialog')
  await panelConcepto.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
  await panelConcepto.getByLabel('Subcategoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreSubcategoria }).click()
  await expect(panelConcepto.getByLabel('Tipo', { exact: true })).toHaveText('Gasto')
  await panelConcepto.getByLabel('Importe previsto').fill('50.00')
  await panelConcepto.getByRole('button', { name: 'Añadir concepto' }).click()

  const filaMensual = page.locator('tbody tr', { hasText: nombreSubcategoria })
  await expect(filaMensual).toBeVisible()
  await expect(filaMensual).toContainText('Mensual')
  // Todos los meses son previsión (-50,00 €), no hay movimientos reales todavía.
  for (let mes = 1; mes <= 12; mes++) {
    await expect(celdaMes(filaMensual, mes)).toContainText('-50,00 €')
  }
  await page.screenshot({ path: 'e2e/capturas/resumen-anual-01-previsto.png' })

  // Un movimiento real en el mes actual sustituye la previsión de ese mes.
  await page.goto('/gestion/movimientos')
  await crearMovimiento(
    page,
    numeroCuenta,
    nombreCategoria,
    nombreSubcategoria,
    descripcionMovimiento,
    '-30.00',
    fechaMovimiento,
  )

  await page.goto('/resumen-anual')
  await expect(celdaMes(filaMensual, mesActualNumero)).toContainText('-30,00 €')
  const otroMes = mesActualNumero === 1 ? 2 : 1
  await expect(celdaMes(filaMensual, otroMes)).toContainText('-50,00 €')
  await page.screenshot({ path: 'e2e/capturas/resumen-anual-02-mezcla-real-previsto.png' })

  // Concepto anual con mes de inicio marzo: solo aparece en marzo.
  await page.getByRole('button', { name: 'Añadir concepto' }).click()
  await panelConcepto.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
  await panelConcepto.getByLabel('Periodicidad', { exact: true }).click()
  await page.getByRole('option', { name: 'Anual' }).click()
  await panelConcepto.getByLabel('Mes de inicio', { exact: true }).click()
  await page.getByRole('option', { name: 'Marzo' }).click()
  await panelConcepto.getByLabel('Importe previsto').fill('120.00')
  await panelConcepto.getByRole('button', { name: 'Añadir concepto' }).click()

  const filaAnual = page.locator('tbody tr', { hasText: nombreCategoria }).filter({
    hasText: 'Anual',
  })
  await expect(filaAnual).toBeVisible()
  await expect(celdaMes(filaAnual, 3)).toContainText('-120,00 €')
  await expect(celdaMes(filaAnual, 4)).toContainText('0,00 €')

  // Editar el concepto mensual: cambia el importe previsto para los meses sin movimiento real.
  await filaMensual.getByRole('button', { name: 'Editar' }).click()
  await expect(panelConcepto.getByRole('heading', { name: 'Editar concepto' })).toBeVisible()
  await panelConcepto.getByLabel('Importe previsto').fill('60.00')
  await panelConcepto.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(celdaMes(filaMensual, otroMes)).toContainText('-60,00 €')
  await expect(celdaMes(filaMensual, mesActualNumero)).toContainText('-30,00 €')

  // Editar en línea una celda prevista: fija un ajuste manual solo para ese mes.
  await celdaMes(filaMensual, otroMes).getByRole('button').click()
  const entradaCelda = celdaMes(filaMensual, otroMes).locator('input')
  await expect(entradaCelda).toHaveValue('-60.00')
  await entradaCelda.fill('-99.00')
  await entradaCelda.press('Enter')
  await expect(celdaMes(filaMensual, otroMes)).toContainText('-99,00 €')
  await expect(celdaMes(filaMensual, otroMes)).toHaveClass(/border-dashed/)
  // El resto de meses previstos no se ven afectados por el ajuste puntual.
  const mesSinTocar = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find(
    (mes) => mes !== otroMes && mes !== mesActualNumero,
  )!
  await expect(celdaMes(filaMensual, mesSinTocar)).toContainText('-60,00 €')
  await page.screenshot({ path: 'e2e/capturas/resumen-anual-03-celda-ajustada.png' })

  // Añadir un valor bajo demanda en una celda vacía (mes fuera de la periodicidad anual).
  await celdaMes(filaAnual, 4).getByRole('button').click()
  const entradaCeldaVacia = celdaMes(filaAnual, 4).locator('input')
  await entradaCeldaVacia.fill('-20.00')
  await entradaCeldaVacia.press('Enter')
  await expect(celdaMes(filaAnual, 4)).toContainText('-20,00 €')
  await expect(celdaMes(filaAnual, 4)).toHaveClass(/border-dashed/)

  // Revertir el ajuste (vaciar la celda) vuelve al valor calculado (previsto).
  await celdaMes(filaMensual, otroMes).getByRole('button').click()
  const entradaReversion = celdaMes(filaMensual, otroMes).locator('input')
  await entradaReversion.fill('')
  await entradaReversion.press('Enter')
  await expect(celdaMes(filaMensual, otroMes)).toContainText('-60,00 €')
  await expect(celdaMes(filaMensual, otroMes)).not.toHaveClass(/border-dashed/)

  // Eliminar el concepto anual.
  await filaAnual.getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(filaAnual).toHaveCount(0)

  // Regresión del bug: un concepto con Tipo=Ingreso debe aparecer en "Ingresos", no en "Gastos".
  await page.getByRole('button', { name: 'Añadir concepto' }).click()
  await panelConcepto.getByLabel('Categoría', { exact: true }).click()
  await page.getByRole('option', { name: nombreCategoria }).click()
  await panelConcepto.getByLabel('Tipo', { exact: true }).click()
  await page.getByRole('option', { name: 'Ingreso' }).click()
  await panelConcepto.getByLabel('Importe previsto').fill('500.00')
  await panelConcepto.getByRole('button', { name: 'Añadir concepto' }).click()

  // Los <section> de Gastos/Ingresos están anidados dentro del <section> de la
  // vista, así que se localizan por su <h3> directo (no por "hasText", que
  // también matchearía el contenedor exterior); y la fila se localiza por el
  // texto EXACTO del nombre (no "hasText", que en modo insensible a mayúsculas
  // también encontraría "Subcategoría..." como substring de "Categoría...").
  const seccionIngresos = page.locator('section:has(> h3:text-is("Ingresos"))')
  const filaIngreso = seccionIngresos
    .locator('tbody tr')
    .filter({ has: page.getByText(nombreCategoria, { exact: true }) })
  await expect(filaIngreso).toBeVisible()
  await expect(celdaMes(filaIngreso, 1)).toContainText('500,00 €')
  const seccionGastos = page.locator('section:has(> h3:text-is("Gastos"))')
  await expect(
    seccionGastos
      .locator('tbody tr')
      .filter({ has: page.getByText(nombreCategoria, { exact: true }) }),
  ).toHaveCount(0)
})
