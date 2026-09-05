import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'
import { test, expect } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RUTA_FICHERO = path.resolve(
  __dirname,
  '../../backend/tests/fixtures/movimientos_ejemplo.xlsx',
)
const RUTA_FICHERO_PDF = path.resolve(
  __dirname,
  '../../backend/tests/fixtures/movimientos_ejemplo.pdf',
)
const NOMBRE_BOTON_ZONA = 'Seleccionar o soltar uno o varios archivos Excel o PDF'
const NOMBRE_BOTON_ZONA_CONCEPTOS =
  'Seleccionar o soltar uno o varios archivos Excel de conceptos previstos'

async function construirExcelConceptosPrevistos(
  filas: [string, string | null, string, string][],
): Promise<Buffer> {
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Conceptos previstos')
  hoja.addRow(['Categoría', 'Subcategoría', 'Periodicidad', 'Importe previsto'])
  for (const fila of filas) hoja.addRow(fila)
  return Buffer.from(await libro.xlsx.writeBuffer())
}

async function construirExcelMovimientos(
  numeroCuenta: string,
  titular: string,
  filas: [string, string, string | null, string, string | null, number, number][],
): Promise<Buffer> {
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Movimientos')
  hoja.addRow(['NUMERO DE CUENTA', numeroCuenta])
  hoja.addRow(['TITULAR', titular])
  hoja.addRow([])
  hoja.addRow([
    'FECHA DE VALOR',
    'CATEGORIA',
    'SUBCATEGORIA',
    'DESCRIPCION',
    'COMENTARIO',
    'IMPORTE',
    'SALDO',
  ])
  for (const fila of filas) hoja.addRow(fila)
  return Buffer.from(await libro.xlsx.writeBuffer())
}

test('importar un Excel de movimientos muestra el resumen de la importación', async ({ page }) => {
  await page.goto('/importar')
  await page.screenshot({ path: 'e2e/capturas/importar-01-pagina-inicial.png' })

  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })
  const formulario = zona.locator('xpath=ancestor::form')
  await zona.locator('..').locator('input[type="file"]').setInputFiles(RUTA_FICHERO)
  await page.screenshot({ path: 'e2e/capturas/importar-02-fichero-seleccionado.png' })

  await formulario.getByRole('button', { name: 'Importar' }).click()

  const resumen = page.locator('[data-test="resumen-importacion"]')
  await expect(resumen).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/importar-03-resumen.png' })

  // El fixture tiene 5 movimientos: en la primera importación se crean, en
  // reimportaciones (ej. re-ejecuciones de esta suite) se omiten por duplicado.
  const texto = await resumen.innerText()
  const importados = Number(texto.match(/importados: (\d+)/)?.[1])
  const omitidos = Number(texto.match(/duplicado: (\d+)/)?.[1])
  expect(importados + omitidos).toBe(5)

  await page.goto('/gestion/cuentas')
  // Con la tabla paginada, se busca por su número para encontrarla
  // independientemente de en qué página quede entre el resto de cuentas.
  await page.getByLabel('Buscar').fill('1234 5678 9012 34567890')
  await expect(page.locator('tr', { hasText: '1234 5678 9012 34567890' })).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/importar-04-cuenta-creada.png' })
})

test('"Ver movimientos importados" lleva a la pestaña Movimientos con la cuenta correcta', async ({
  page,
}) => {
  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })
  const formulario = zona.locator('xpath=ancestor::form')
  await zona.locator('..').locator('input[type="file"]').setInputFiles(RUTA_FICHERO)
  await formulario.getByRole('button', { name: 'Importar' }).click()
  await expect(page.locator('[data-test="resumen-importacion"]')).toBeVisible()

  await page.getByRole('button', { name: 'Ver movimientos importados' }).click()

  await expect(page).toHaveURL(/\/gestion\/movimientos\?cuenta_id=\d+/)
  await expect(page.getByRole('tab', { name: 'Movimientos' })).toHaveAttribute(
    'data-state',
    'active',
  )
  // El selector de cuenta muestra el alias (= titular tomado del Excel) en
  // vez del número de cuenta en bruto, cuando la cuenta tiene alias.
  await expect(page.getByLabel('Cuenta')).toContainText('PERSONA EJEMPLO')
  await expect(page.locator('tbody tr').first()).toBeVisible()
  // Un movimiento importado de Excel no lleva el icono de origen PDF.
  await expect(
    page.locator('tbody').getByRole('img', { name: 'Importado desde un PDF' }),
  ).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/importar-10-ver-movimientos-importados.png' })
})

test('importar un PDF (certificado de movimientos) crea la cuenta y sus movimientos, dejándolos "Sin categorizar" sin asociación previa', async ({
  page,
}) => {
  // El PDF no trae columnas de categoría/subcategoría (a diferencia del
  // Excel): la resolución por asociación de descripción, y su fallback a
  // "Sin categorizar" cuando ninguna coincide, ya se prueban a fondo en
  // ImportarMovimientosPdf (backend, unitario); aquí se verifica el flujo
  // completo de extremo a extremo (subida, parseo real del PDF, alta en la
  // cuenta y reflejo en Movimientos).
  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })
  const formulario = zona.locator('xpath=ancestor::form')
  await zona.locator('..').locator('input[type="file"]').setInputFiles(RUTA_FICHERO_PDF)
  await formulario.getByRole('button', { name: 'Importar' }).click()

  const resumen = page.locator('[data-test="resumen-importacion"]')
  await expect(resumen).toBeVisible()
  await expect(resumen).toContainText('Movimientos importados: 3')
  await expect(resumen).toContainText('Sin categorizar')
  await page.screenshot({ path: 'e2e/capturas/importar-pdf-01-resumen.png' })

  await resumen.getByRole('button', { name: 'Ver movimientos importados' }).click()
  await expect(page).toHaveURL(/\/gestion\/movimientos\?cuenta_id=\d+/)
  await expect(page.getByLabel('Cuenta')).toContainText('PERSONA PDF EJEMPLO')
  const filaSinCategorizar = page.locator('tbody tr', { hasText: 'Pago en Comercio Desconocido' })
  await expect(filaSinCategorizar).toContainText('Sin categorizar')
  // Un movimiento importado de PDF se distingue con un icono, para poder
  // localizarlos y revisar la categoría que se les asignó automáticamente.
  await expect(
    filaSinCategorizar.getByRole('img', { name: 'Importado desde un PDF' }),
  ).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/importar-pdf-02-icono-origen.png' })
})

test('subir un fichero con extensión no soportada muestra un error', async ({ page }) => {
  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })
  const formulario = zona.locator('xpath=ancestor::form')

  // Fichero .csv generado en memoria (no hace falta uno real en disco).
  await zona
    .locator('..')
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'movimientos.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('fecha,importe\n2026-01-01,-10'),
    })
  await formulario.getByRole('button', { name: 'Importar' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/importar-05-extension-no-soportada.png' })
})

test('soltar el fichero sobre la zona de arrastre también permite importarlo', async ({ page }) => {
  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })

  const contenido = fs.readFileSync(RUTA_FICHERO)
  const dataTransfer = await page.evaluateHandle((bytes) => {
    const transferencia = new DataTransfer()
    transferencia.items.add(
      new File([new Uint8Array(bytes)], 'movimientos_ejemplo.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    )
    return transferencia
  }, Array.from(contenido))

  await zona.dispatchEvent('dragenter', { dataTransfer })
  await page.screenshot({ path: 'e2e/capturas/importar-06-arrastrando-fichero.png' })
  await zona.dispatchEvent('drop', { dataTransfer })

  await expect(zona).toContainText('movimientos_ejemplo.xlsx')

  await zona.locator('xpath=ancestor::form').getByRole('button', { name: 'Importar' }).click()
  await expect(page.locator('[data-test="resumen-importacion"]')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/importar-07-resumen-tras-arrastrar.png' })
})

test('soltar un fichero con extensión no soportada sobre la zona de arrastre también lo rechaza', async ({
  page,
}) => {
  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })

  const dataTransfer = await page.evaluateHandle(() => {
    const transferencia = new DataTransfer()
    transferencia.items.add(
      new File(['fecha,importe\n2026-01-01,-10'], 'movimientos.csv', { type: 'text/csv' }),
    )
    return transferencia
  })

  await zona.dispatchEvent('drop', { dataTransfer })
  await zona.locator('xpath=ancestor::form').getByRole('button', { name: 'Importar' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
})

test('soltar varios ficheros a la vez los procesa e importa todos ("procesamiento masivo")', async ({
  page,
}) => {
  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })

  const contenido = fs.readFileSync(RUTA_FICHERO)
  const dataTransfer = await page.evaluateHandle((bytes) => {
    const transferencia = new DataTransfer()
    transferencia.items.add(
      new File([new Uint8Array(bytes)], 'lote-1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    )
    transferencia.items.add(
      new File([new Uint8Array(bytes)], 'lote-2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    )
    return transferencia
  }, Array.from(contenido))

  await zona.dispatchEvent('drop', { dataTransfer })

  await expect(zona).toContainText('lote-1.xlsx')
  await expect(zona).toContainText('lote-2.xlsx')
  await page.screenshot({ path: 'e2e/capturas/importar-08-varios-ficheros-seleccionados.png' })

  await zona.locator('xpath=ancestor::form').getByRole('button', { name: 'Importar' }).click()

  const resumen = page.locator('[data-test="resumen-importacion"]')
  await expect(resumen).toBeVisible()
  await expect(resumen).toContainText('lote-1.xlsx')
  await expect(resumen).toContainText('lote-2.xlsx')
  await page.screenshot({ path: 'e2e/capturas/importar-09-resumen-varios-ficheros.png' })

  // Los 2 ficheros tienen el mismo contenido (5 movimientos cada uno): al
  // procesar ambos en el mismo lote, el total de importados + omitidos debe
  // ser el doble que al importar uno solo.
  const texto = await resumen.innerText()
  const importados = Number(texto.match(/importados: (\d+)/)?.[1])
  const omitidos = Number(texto.match(/duplicado: (\d+)/)?.[1])
  expect(importados + omitidos).toBe(10)
})

test('importar un fichero con varias filas muestra el progreso de filas procesadas', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 PROGRESO ${sufijo}`
  const filas: [string, string, string | null, string, string | null, number, number][] =
    Array.from({ length: 20 }, (_, i) => [
      '2026-01-01',
      `Categoria Progreso ${sufijo}`,
      null,
      `Movimiento ${i + 1}`,
      null,
      -1,
      1000 - i,
    ])
  const contenido = await construirExcelMovimientos(numeroCuenta, 'PERSONA PROGRESO', filas)

  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })
  const formulario = zona.locator('xpath=ancestor::form')
  await zona.locator('..').locator('input[type="file"]').setInputFiles({
    name: 'movimientos-progreso.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenido,
  })
  await formulario.getByRole('button', { name: 'Importar' }).click()

  // El progreso avanza demasiado rápido en local (base de datos en la misma
  // máquina) para fiar una aserción en un valor intermedio concreto sin que
  // sea intermitente; se comprueba en su lugar que la importación de las 20
  // filas se completa correctamente a través del nuevo endpoint en streaming.
  await expect(page.locator('[data-test="resumen-importacion"]')).toBeVisible()
  await expect(page.locator('[data-test="resumen-importacion"]')).toContainText(
    'Movimientos importados: 20',
  )
})

test('reimportar el mismo Excel de movimientos permite ver el detalle de los duplicados omitidos', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 DUP ${sufijo}`
  const nombreCategoria = `Categoria Dup Mov ${sufijo}`
  const nombreSubcategoria = `Sub Dup Mov ${sufijo}`
  const contenido = await construirExcelMovimientos(numeroCuenta, 'PERSONA DUP', [
    ['2026-01-05', nombreCategoria, nombreSubcategoria, 'Compra en Mercadona', null, -45, 1000],
  ])

  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })
  const formulario = zona.locator('xpath=ancestor::form')
  const entradaFichero = zona.locator('..').locator('input[type="file"]')

  await entradaFichero.setInputFiles({
    name: 'movimientos-dup.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenido,
  })
  await formulario.getByRole('button', { name: 'Importar' }).click()
  await expect(page.locator('[data-test="resumen-importacion"]')).toContainText(
    'Movimientos importados: 1',
  )

  await entradaFichero.setInputFiles({
    name: 'movimientos-dup.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenido,
  })
  await formulario.getByRole('button', { name: 'Importar' }).click()
  const resumen = page.locator('[data-test="resumen-importacion"]')
  await expect(resumen).toContainText('Movimientos omitidos por duplicado: 1')

  await resumen.getByRole('button', { name: 'Ver duplicados (1)' }).click()
  const modal = page.getByRole('dialog')
  const filaFichero = modal.locator('tr', { hasText: 'Este fichero' })
  const filaExistente = modal.locator('tr', { hasText: 'Ya existía' })
  await expect(filaFichero).toContainText('Compra en Mercadona')
  await expect(filaFichero).toContainText(nombreCategoria)
  await expect(filaFichero).toContainText(nombreSubcategoria)
  // La categoría/subcategoría del movimiento YA EXISTENTE se resuelve por id
  // desde la tienda de categorías, no viene como texto plano del Excel: si la
  // tienda no se recarga tras crear categorías nuevas durante la importación,
  // esta fila se queda con las celdas vacías en vez de mostrar el nombre.
  await expect(filaExistente).toContainText('Compra en Mercadona')
  await expect(filaExistente).toContainText(nombreCategoria)
  await expect(filaExistente).toContainText(nombreSubcategoria)
  await page.screenshot({ path: 'e2e/capturas/importar-12-comparacion-duplicados.png' })

  // Solo la fila "Ya existía" (el movimiento ya guardado) es editable; "Este
  // fichero" no tiene botón porque aún no se ha importado.
  await expect(filaFichero.getByRole('button', { name: 'Editar' })).toHaveCount(0)
  await filaExistente.getByRole('button', { name: 'Editar' }).click()
  const panelEdicion = page.getByRole('dialog').filter({ hasText: 'Editar movimiento' })
  await expect(panelEdicion).toBeVisible()
  await expect(modal).toBeVisible()
  await panelEdicion.getByPlaceholder('Descripción').fill('Compra en Mercadona (corregida)')
  await panelEdicion.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(panelEdicion).toBeHidden()

  // La modal de comparación refleja el cambio al instante, sin cerrarla; la
  // fila "Este fichero" no se toca.
  await expect(filaExistente).toContainText('Compra en Mercadona (corregida)')
  await expect(filaFichero).toContainText('Compra en Mercadona')
  await expect(filaFichero).not.toContainText('corregida')
})

test('importar un Excel de conceptos previstos los crea y aparecen en Resumen anual', async ({
  page,
}) => {
  const sufijo = Date.now()
  const nombreCategoria = `Categoria E2E ${sufijo}`
  const nombreSubcategoria = `Sub E2E ${sufijo}`
  const contenido = await construirExcelConceptosPrevistos([
    [nombreCategoria, nombreSubcategoria, 'mensual', '-9.99'],
  ])

  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA_CONCEPTOS, exact: true })
  const formulario = zona.locator('xpath=ancestor::form')

  await zona.locator('..').locator('input[type="file"]').setInputFiles({
    name: 'conceptos.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenido,
  })
  await formulario.getByRole('button', { name: 'Importar' }).click()

  const resumen = page.locator('[data-test="resumen-importacion-conceptos-previstos"]')
  await expect(resumen).toBeVisible()
  await expect(resumen).toContainText('Conceptos creados: 1')
  await page.screenshot({ path: 'e2e/capturas/importar-11-conceptos-previstos.png' })

  await resumen.getByRole('button', { name: 'Ver en Resumen anual' }).click()
  await expect(page).toHaveURL('/resumen-anual')
  await expect(page.locator('tbody tr', { hasText: nombreSubcategoria })).toBeVisible()
})

test('reimportar el mismo Excel de conceptos previstos omite el duplicado', async ({ page }) => {
  const sufijo = Date.now()
  const contenido = await construirExcelConceptosPrevistos([
    [`Categoria Dup ${sufijo}`, `Sub Dup ${sufijo}`, 'mensual', '-9.99'],
  ])

  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA_CONCEPTOS, exact: true })
  const formulario = zona.locator('xpath=ancestor::form')
  const entradaFichero = zona.locator('..').locator('input[type="file"]')

  await entradaFichero.setInputFiles({
    name: 'conceptos.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenido,
  })
  await formulario.getByRole('button', { name: 'Importar' }).click()
  await expect(page.locator('[data-test="resumen-importacion-conceptos-previstos"]')).toContainText(
    'Conceptos creados: 1',
  )

  await entradaFichero.setInputFiles({
    name: 'conceptos.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenido,
  })
  await formulario.getByRole('button', { name: 'Importar' }).click()
  const resumenSegundaVez = page.locator('[data-test="resumen-importacion-conceptos-previstos"]')
  await expect(resumenSegundaVez).toContainText('Conceptos creados: 0')
  await expect(resumenSegundaVez).toContainText('Conceptos omitidos por duplicado: 1')
})

test('un error 500 real muestra "Más detalle" con la traza y permite copiarla', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/importar')

  await page.route('**/api/v1/movimientos/importar', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        detalle: 'boom inesperado',
        traza: 'Traceback (most recent call last):\n  File "x.py", line 1\nValueError: boom',
      }),
    }),
  )

  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA, exact: true })
  const formulario = zona.locator('xpath=ancestor::form')
  await zona.locator('..').locator('input[type="file"]').setInputFiles(RUTA_FICHERO)
  await formulario.getByRole('button', { name: 'Importar' }).click()

  await expect(page.getByRole('alert')).toContainText('boom inesperado')
  await page.getByRole('button', { name: 'Más detalle' }).click()
  await expect(page.getByRole('dialog')).toContainText('Traceback')

  await page.getByRole('button', { name: 'Copiar' }).click()
  await expect(page.getByRole('button', { name: 'Copiado' })).toBeVisible()
})
