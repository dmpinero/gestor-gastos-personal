import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RUTA_FICHERO = path.resolve(
  __dirname,
  '../../backend/tests/fixtures/movimientos_ejemplo.xlsx',
)

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

  await page.goto('/cuentas')
  await expect(page.locator('tr', { hasText: '1234 5678 9012 34567890' })).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/importar-04-cuenta-creada.png' })
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
