import ExcelJS from 'exceljs'
import { test, expect, type Download, type Page, type Locator } from '@playwright/test'
import { elegirOpcion, seleccionarCuenta } from './utilidades'

async function bufferDeDescarga(descarga: Download): Promise<Buffer> {
  const flujo = await descarga.createReadStream()
  const trozos: Buffer[] = []
  for await (const trozo of flujo) {
    trozos.push(trozo as Buffer)
  }
  return Buffer.concat(trozos)
}

async function crearMovimiento(
  page: Page,
  numeroCuenta: string,
  nombreCategoria: string,
  subcategoria: string | null,
  descripcion: string,
  importe: string,
  fecha: string,
): Promise<void> {
  await seleccionarCuenta(page, numeroCuenta)
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill(fecha)
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
  if (subcategoria) {
    await elegirOpcion(page, panel.getByLabel('Subcategoría', { exact: true }), subcategoria)
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

// El contador de conceptos de una sección (Gastos/Ingresos) es un total del
// año en curso, no algo aislado por test: en CI la base de datos se comparte
// entre ejecuciones/tests, así que puede haber otros conceptos previstos ya
// creados. Por eso se comprueba el INCREMENTO respecto a un valor leído antes
// de actuar, no un valor absoluto como "1 concepto".
async function contarConceptos(seccion: Locator): Promise<number> {
  const texto = (await seccion.textContent()) ?? ''
  return Number(texto.match(/(\d+) concepto/)?.[1] ?? 0)
}

test('crear, editar y eliminar conceptos previstos, combinando importes reales y previstos', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 RESU ${sufijo}`
  const nombreCategoria = `Categoria RESU ${sufijo}`
  const nombreSubcategoria = `Subcategoria RESU ${sufijo}`
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
  const seccionGastos = page.locator('section:has(> h3:text-is("Gastos"))')
  const conceptosGastosIniciales = await contarConceptos(seccionGastos)
  await page.getByRole('button', { name: 'Añadir concepto' }).click()
  const panelConcepto = page.getByRole('dialog')
  await elegirOpcion(page, panelConcepto.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await elegirOpcion(
    page,
    panelConcepto.getByLabel('Subcategoría', { exact: true }),
    nombreSubcategoria,
  )
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
  await expect(seccionGastos).toContainText(`${conceptosGastosIniciales + 1} concepto`)
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
  await elegirOpcion(page, panelConcepto.getByLabel('Categoría', { exact: true }), nombreCategoria)
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
  await expect(seccionGastos).toContainText(`${conceptosGastosIniciales + 2} concepto`)

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
  await expect(seccionGastos).toContainText(`${conceptosGastosIniciales + 1} concepto`)

  // Regresión del bug: un concepto con Tipo=Ingreso debe aparecer en "Ingresos", no en "Gastos".
  const seccionIngresos = page.locator('section:has(> h3:text-is("Ingresos"))')
  const conceptosIngresosIniciales = await contarConceptos(seccionIngresos)
  await page.getByRole('button', { name: 'Añadir concepto' }).click()
  await elegirOpcion(page, panelConcepto.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await panelConcepto.getByLabel('Tipo', { exact: true }).click()
  await page.getByRole('option', { name: 'Ingreso' }).click()
  await panelConcepto.getByLabel('Importe previsto').fill('500.00')
  await panelConcepto.getByRole('button', { name: 'Añadir concepto' }).click()

  // Los <section> de Gastos/Ingresos están anidados dentro del <section> de la
  // vista, así que se localizan por su <h3> directo (no por "hasText", que
  // también matchearía el contenedor exterior); y la fila se localiza por el
  // texto EXACTO del nombre (no "hasText", que en modo insensible a mayúsculas
  // también encontraría "Subcategoría..." como substring de "Categoría...").
  const filaIngreso = seccionIngresos
    .locator('tbody tr')
    .filter({ has: page.getByText(nombreCategoria, { exact: true }) })
  await expect(filaIngreso).toBeVisible()
  await expect(celdaMes(filaIngreso, 1)).toContainText('500,00 €')
  await expect(seccionIngresos).toContainText(`${conceptosIngresosIniciales + 1} concepto`)
  await expect(
    seccionGastos
      .locator('tbody tr')
      .filter({ has: page.getByText(nombreCategoria, { exact: true }) }),
  ).toHaveCount(0)
})

test('exportar a Excel, editar una celda y reimportarlo actualiza solo esa celda', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 XLS ${sufijo}`
  const nombreCategoria = `Categoria XLS ${sufijo}`
  const nombreSubcategoria = `Subcategoria XLS ${sufijo}`
  const anioActual = new Date().getFullYear()

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

  await page.goto('/resumen-anual')
  await page.getByRole('button', { name: 'Añadir concepto' }).click()
  const panelConcepto = page.getByRole('dialog')
  await elegirOpcion(page, panelConcepto.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await elegirOpcion(
    page,
    panelConcepto.getByLabel('Subcategoría', { exact: true }),
    nombreSubcategoria,
  )
  await panelConcepto.getByLabel('Importe previsto').fill('50.00')
  await panelConcepto.getByRole('button', { name: 'Añadir concepto' }).click()

  const filaConcepto = page.locator('tbody tr', { hasText: nombreSubcategoria })
  await expect(filaConcepto).toBeVisible()

  // Exportar: el botón abre un diálogo con el rango de años (prellenado con
  // el año visible en pantalla); se confirma sin tocar nada para exportar
  // solo ese año, y se captura la descarga real para leerla con exceljs.
  await page.getByRole('button', { name: 'Exportar a Excel' }).click()
  const panelExportar = page.getByRole('dialog')
  await expect(panelExportar).toBeVisible()
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    panelExportar.getByRole('button', { name: 'Exportar' }).click(),
  ])
  expect(descarga.suggestedFilename()).toBe(`resumen-anual-${anioActual}.xlsx`)
  const contenidoOriginal = await bufferDeDescarga(descarga)

  // Se edita el Excel descargado como haría el usuario: se cambia el importe
  // de enero para nuestro concepto, sin tocar nada más.
  const libro = new ExcelJS.Workbook()
  await libro.xlsx.load(contenidoOriginal)
  const hoja = libro.getWorksheet('Gastos')!
  let filaEncontrada: number | null = null
  hoja.eachRow((fila, numeroFila) => {
    if (fila.getCell(3).value === nombreSubcategoria) filaEncontrada = numeroFila
  })
  expect(filaEncontrada).not.toBeNull()
  hoja.getRow(filaEncontrada!).getCell(5).value = -77 // columna E = enero
  const contenidoEditado = Buffer.from(await libro.xlsx.writeBuffer())

  // Reimportar: solo la celda de enero cambia; el resto se queda igual.
  await page.getByRole('button', { name: 'Importar Excel' }).click()
  const panelImportar = page.getByRole('dialog')
  await panelImportar.locator('input[type="file"]').setInputFiles({
    name: `resumen-anual-${anioActual}-editado.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenidoEditado,
  })
  await panelImportar.getByRole('button', { name: 'Importar' }).click()
  await expect(panelImportar.getByText('1 celdas actualizadas.')).toBeVisible()
  await expect(panelImportar.getByText('0 celdas revertidas al valor calculado.')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/resumen-anual-04-importar-excel.png' })

  // "Cerrar" tiene dos coincidencias en el Sheet: nuestro botón explícito y el
  // botón "×" de cierre incorporado (mismo texto accesible, sr-only); el
  // nuestro es el primero en el DOM.
  await panelImportar.getByRole('button', { name: 'Cerrar' }).first().click()
  await expect(celdaMes(filaConcepto, 1)).toContainText('-77,00 €')
  await expect(celdaMes(filaConcepto, 1)).toHaveClass(/border-dashed/)
  await expect(celdaMes(filaConcepto, 2)).toContainText('-50,00 €')

  // Reexportar el estado actual y reimportarlo tal cual (sin tocar nada) no
  // tiene ningún efecto: es la garantía central de la importación por diff.
  await page.getByRole('button', { name: 'Exportar a Excel' }).click()
  await expect(panelExportar).toBeVisible()
  const [descargaSinCambios] = await Promise.all([
    page.waitForEvent('download'),
    panelExportar.getByRole('button', { name: 'Exportar' }).click(),
  ])
  const contenidoSinCambios = await bufferDeDescarga(descargaSinCambios)

  await page.getByRole('button', { name: 'Importar Excel' }).click()
  await panelImportar.locator('input[type="file"]').setInputFiles({
    name: `resumen-anual-${anioActual}-sin-cambios.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenidoSinCambios,
  })
  await panelImportar.getByRole('button', { name: 'Importar' }).click()
  await expect(panelImportar.getByText('0 celdas actualizadas.')).toBeVisible()
  await expect(panelImportar.getByText('0 celdas revertidas al valor calculado.')).toBeVisible()
  await panelImportar.getByRole('button', { name: 'Cerrar' }).first().click()

  // Vaciar en el Excel la celda ajustada y reimportar revierte al valor
  // calculado (previsto), igual que vaciarla a mano en la propia tabla.
  const libroParaRevertir = new ExcelJS.Workbook()
  await libroParaRevertir.xlsx.load(contenidoSinCambios)
  const hojaParaRevertir = libroParaRevertir.getWorksheet('Gastos')!
  hojaParaRevertir.getRow(filaEncontrada!).getCell(5).value = null
  const contenidoRevertido = Buffer.from(await libroParaRevertir.xlsx.writeBuffer())

  await page.getByRole('button', { name: 'Importar Excel' }).click()
  await panelImportar.locator('input[type="file"]').setInputFiles({
    name: `resumen-anual-${anioActual}-revertido.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenidoRevertido,
  })
  await panelImportar.getByRole('button', { name: 'Importar' }).click()
  await expect(panelImportar.getByText('1 celdas revertidas al valor calculado.')).toBeVisible()
  await panelImportar.getByRole('button', { name: 'Cerrar' }).first().click()
  await expect(celdaMes(filaConcepto, 1)).toContainText('-50,00 €')
  await expect(celdaMes(filaConcepto, 1)).not.toHaveClass(/border-dashed/)
})

test('exportar un rango de dos años, editar celdas de ambos y reimportar actualiza cada año', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 RANGO ${sufijo}`
  const nombreCategoria = `Categoria RANGO ${sufijo}`
  const anioActual = new Date().getFullYear()
  const anioSiguiente = anioActual + 1

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

  await page.goto('/resumen-anual')
  await page.getByRole('button', { name: 'Añadir concepto' }).click()
  const panelConcepto = page.getByRole('dialog')
  await elegirOpcion(page, panelConcepto.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await panelConcepto.getByLabel('Importe previsto').fill('50.00')
  await panelConcepto.getByRole('button', { name: 'Añadir concepto' }).click()

  const filaConcepto = page.locator('tbody tr', { hasText: nombreCategoria })
  await expect(filaConcepto).toBeVisible()

  // Exportar el rango [añoActual, añoSiguiente] en el diálogo de exportación.
  await page.getByRole('button', { name: 'Exportar a Excel' }).click()
  const panelExportar = page.getByRole('dialog')
  await expect(panelExportar).toBeVisible()
  await panelExportar.getByLabel('Año hasta').fill(String(anioSiguiente))
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    panelExportar.getByRole('button', { name: 'Exportar' }).click(),
  ])
  expect(descarga.suggestedFilename()).toBe(`resumen-anual-${anioActual}-${anioSiguiente}.xlsx`)
  const contenido = await bufferDeDescarga(descarga)

  // El fichero trae una fila por año para el mismo concepto: se edita enero
  // en la fila del primer año y febrero en la del segundo.
  const libro = new ExcelJS.Workbook()
  await libro.xlsx.load(contenido)
  const hoja = libro.getWorksheet('Gastos')!
  let filaAnioActual: number | null = null
  let filaAnioSiguiente: number | null = null
  hoja.eachRow((fila, numeroFila) => {
    if (fila.getCell(3).value !== nombreCategoria) return
    if (fila.getCell(1).value === anioActual) filaAnioActual = numeroFila
    if (fila.getCell(1).value === anioSiguiente) filaAnioSiguiente = numeroFila
  })
  expect(filaAnioActual).not.toBeNull()
  expect(filaAnioSiguiente).not.toBeNull()
  hoja.getRow(filaAnioActual!).getCell(5).value = -65 // columna E = enero
  hoja.getRow(filaAnioSiguiente!).getCell(6).value = -70 // columna F = febrero
  const contenidoEditado = Buffer.from(await libro.xlsx.writeBuffer())

  await page.getByRole('button', { name: 'Importar Excel' }).click()
  const panelImportar = page.getByRole('dialog')
  await panelImportar.locator('input[type="file"]').setInputFiles({
    name: `resumen-anual-${anioActual}-${anioSiguiente}-editado.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenidoEditado,
  })
  await panelImportar.getByRole('button', { name: 'Importar' }).click()
  await expect(panelImportar.getByText('2 celdas actualizadas.')).toBeVisible()
  await panelImportar.getByRole('button', { name: 'Cerrar' }).first().click()

  // El año visible en pantalla sigue siendo el actual: enero ya se ve
  // actualizado sin recargar nada más.
  await expect(celdaMes(filaConcepto, 1)).toContainText('-65,00 €')

  // Cambiar al año siguiente y comprobar que febrero también se actualizó.
  await page.getByLabel('Año', { exact: true }).fill(String(anioSiguiente))
  await expect(celdaMes(filaConcepto, 2)).toContainText('-70,00 €')
})
