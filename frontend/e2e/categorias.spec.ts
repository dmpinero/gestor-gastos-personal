import { test, expect } from '@playwright/test'

test('gestión de categoría y subcategoría', async ({ page }) => {
  const nombreCategoria = `Categoría E2E ${Date.now()}`
  const nombreSubcategoria = `Subcategoría E2E ${Date.now()}`

  await page.goto('/categorias')
  await page.screenshot({ path: 'e2e/capturas/categorias-01-listado-inicial.png' })

  await page.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await page.getByRole('button', { name: 'Crear categoría' }).click()

  const tarjetaCategoria = page.locator('li', { hasText: nombreCategoria })
  await expect(tarjetaCategoria).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/categorias-02-tras-crear-categoria.png' })

  await tarjetaCategoria.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaCategoria.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaCategoria.locator('li', { hasText: nombreSubcategoria })).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/categorias-03-tras-crear-subcategoria.png' })

  await tarjetaCategoria
    .locator('li', { hasText: nombreSubcategoria })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  await expect(tarjetaCategoria.locator('li', { hasText: nombreSubcategoria })).toHaveCount(0)

  await tarjetaCategoria.getByRole('button', { name: 'Eliminar categoría' }).click()
  await expect(page.locator('li', { hasText: nombreCategoria })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/categorias-04-tras-eliminar.png' })
})
