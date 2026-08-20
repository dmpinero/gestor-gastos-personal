import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RUTA_FICHERO = path.resolve(
  __dirname,
  '../../backend/tests/fixtures/movimientos_ejemplo.xlsx',
)
const NOMBRE_BOTON_ZONA = 'Seleccionar o soltar uno o varios archivos Excel'

test('importar un Excel de movimientos muestra el resumen de la importación', async ({ page }) => {
  await page.goto('/importar')
  await page.screenshot({ path: 'e2e/capturas/importar-01-pagina-inicial.png' })

  await page.locator('input[type="file"]').setInputFiles(RUTA_FICHERO)
  await page.screenshot({ path: 'e2e/capturas/importar-02-fichero-seleccionado.png' })

  await page.getByRole('button', { name: 'Importar' }).click()

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
  await page.locator('input[type="file"]').setInputFiles(RUTA_FICHERO)
  await page.getByRole('button', { name: 'Importar' }).click()
  await expect(page.locator('[data-test="resumen-importacion"]')).toBeVisible()

  await page.getByRole('button', { name: 'Ver movimientos importados' }).click()

  await expect(page).toHaveURL(/\/gestion\/movimientos\?cuenta_id=\d+/)
  await expect(page.getByRole('tab', { name: 'Movimientos' })).toHaveAttribute(
    'data-state',
    'active',
  )
  await expect(page.getByLabel('Cuenta')).toContainText('1234 5678 9012 34567890')
  await expect(page.locator('tbody tr').first()).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/importar-10-ver-movimientos-importados.png' })
})

test('subir un fichero con extensión no soportada muestra un error', async ({ page }) => {
  await page.goto('/importar')

  // Fichero .csv generado en memoria (no hace falta uno real en disco).
  await page.locator('input[type="file"]').setInputFiles({
    name: 'movimientos.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('fecha,importe\n2026-01-01,-10'),
  })
  await page.getByRole('button', { name: 'Importar' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/importar-05-extension-no-soportada.png' })
})

test('soltar el fichero sobre la zona de arrastre también permite importarlo', async ({ page }) => {
  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA })

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

  await page.getByRole('button', { name: 'Importar' }).click()
  await expect(page.locator('[data-test="resumen-importacion"]')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/importar-07-resumen-tras-arrastrar.png' })
})

test('soltar un fichero con extensión no soportada sobre la zona de arrastre también lo rechaza', async ({
  page,
}) => {
  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA })

  const dataTransfer = await page.evaluateHandle(() => {
    const transferencia = new DataTransfer()
    transferencia.items.add(
      new File(['fecha,importe\n2026-01-01,-10'], 'movimientos.csv', { type: 'text/csv' }),
    )
    return transferencia
  })

  await zona.dispatchEvent('drop', { dataTransfer })
  await page.getByRole('button', { name: 'Importar' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
})

test('soltar varios ficheros a la vez los procesa e importa todos ("procesamiento masivo")', async ({
  page,
}) => {
  await page.goto('/importar')
  const zona = page.getByRole('button', { name: NOMBRE_BOTON_ZONA })

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

  await page.getByRole('button', { name: 'Importar' }).click()

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
