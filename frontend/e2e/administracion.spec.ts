import ExcelJS from 'exceljs'
import { test, expect, type Download } from '@playwright/test'

async function bufferDeDescarga(descarga: Download): Promise<Buffer> {
  const flujo = await descarga.createReadStream()
  const trozos: Buffer[] = []
  for await (const trozo of flujo) {
    trozos.push(trozo as Buffer)
  }
  return Buffer.concat(trozos)
}

test('navegar a Administración > Realizar backup descarga un Excel', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Administración' }).click()
  await expect(page.getByRole('link', { name: 'Administración' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('link', { name: 'Realizar backup' })).toBeVisible()

  await page.getByRole('link', { name: 'Realizar backup' }).click()
  await expect(page.getByRole('link', { name: 'Realizar backup' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()

  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Realizar backup' }).click(),
  ])

  expect(descarga.suggestedFilename()).toMatch(/^backup-gestor-gastos_\d{8}_\d{6}\.xlsx$/)
})

test('exportar un backup e importarlo restaura solo los datos que tenía en ese momento', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuentaOriginal = `ES00 ADM ${sufijo}`
  const numeroCuentaPosterior = `ES00 ADM2 ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelOriginal = page.getByRole('dialog')
  await panelOriginal.getByPlaceholder('Número de cuenta').fill(numeroCuentaOriginal)
  await panelOriginal.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuentaOriginal })).toBeVisible()

  await page.goto('/administracion/backup')
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Realizar backup' }).click(),
  ])
  const contenidoBackup = await bufferDeDescarga(descarga)

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelPosterior = page.getByRole('dialog')
  await panelPosterior.getByPlaceholder('Número de cuenta').fill(numeroCuentaPosterior)
  await panelPosterior.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuentaPosterior })).toBeVisible()

  await page.goto('/administracion/importar-backup')
  const zona = page.getByRole('button', {
    name: 'Seleccionar o soltar uno o varios fichero de backup',
    exact: true,
  })
  await zona.locator('..').locator('input[type="file"]').setInputFiles({
    name: 'backup-gestor-gastos.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: contenidoBackup,
  })
  await page.getByRole('button', { name: 'Importar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Importar' }).click()

  await expect(page.locator('[data-test="resumen-importacion-backup"]')).toBeVisible()

  await page.goto('/gestion/cuentas')
  await expect(page.locator('tr', { hasText: numeroCuentaOriginal })).toBeVisible()
  await expect(page.locator('tr', { hasText: numeroCuentaPosterior })).toHaveCount(0)
})

test('cancelar la confirmación de importar no borra ningún dato', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 ADMCANCEL ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panel = page.getByRole('dialog')
  await panel.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panel.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/administracion/importar-backup')
  const zona = page.getByRole('button', {
    name: 'Seleccionar o soltar uno o varios fichero de backup',
    exact: true,
  })
  await zona
    .locator('..')
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'backup-cualquiera.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('contenido irrelevante: no se llega a leer'),
    })
  await page.getByRole('button', { name: 'Importar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()

  await expect(page.getByRole('alertdialog')).toHaveCount(0)

  await page.goto('/gestion/cuentas')
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()
})

test('importar un fichero sin las hojas esperadas muestra un error y no borra nada', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 ADMINVALIDO ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panel = page.getByRole('dialog')
  await panel.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panel.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  const libro = new ExcelJS.Workbook()
  libro.addWorksheet('Hoja cualquiera').addRow(['esto', 'no', 'es', 'un', 'backup'])
  const bufferInvalido = Buffer.from(await libro.xlsx.writeBuffer())

  await page.goto('/administracion/importar-backup')
  const zona = page.getByRole('button', {
    name: 'Seleccionar o soltar uno o varios fichero de backup',
    exact: true,
  })
  await zona.locator('..').locator('input[type="file"]').setInputFiles({
    name: 'no-es-un-backup.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: bufferInvalido,
  })
  await page.getByRole('button', { name: 'Importar' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Importar' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.locator('[data-test="resumen-importacion-backup"]')).toHaveCount(0)

  await page.goto('/gestion/cuentas')
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()
})
