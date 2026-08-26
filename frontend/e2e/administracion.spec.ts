import { test, expect } from '@playwright/test'

test('navegar a Administración > Exportar datos y exportar los datos descarga un Excel', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Administración' }).click()
  await expect(page.getByRole('link', { name: 'Administración' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('link', { name: 'Exportar datos' })).toBeVisible()

  await page.getByRole('link', { name: 'Exportar datos' }).click()
  await expect(page.getByRole('link', { name: 'Exportar datos' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()

  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar datos' }).click(),
  ])

  expect(descarga.suggestedFilename()).toMatch(/^backup-gestor-gastos_\d{8}_\d{6}\.xlsx$/)
})
