import { test, expect } from '@playwright/test'

test('gestión de categoría y subcategoría', async ({ page }) => {
  const nombreCategoria = `Categoría E2E ${Date.now()}`
  const nombreCategoriaEditada = `Categoría E2E editada ${Date.now()}`
  const nombreSubcategoria = `Subcategoría E2E ${Date.now()}`

  await page.goto('/gestion/categorias')
  await page.screenshot({ path: 'e2e/capturas/categorias-01-listado-inicial.png' })

  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  await panel.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panel.getByRole('button', { name: 'Crear categoría' }).click()

  const tarjetaCategoria = page.locator('[data-slot="card"]', { hasText: nombreCategoria })
  await expect(tarjetaCategoria).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/categorias-02-tras-crear-categoria.png' })

  await tarjetaCategoria.getByRole('button', { name: 'Editar' }).click()
  await panel.getByPlaceholder('Nueva categoría').fill(nombreCategoriaEditada)
  await panel.getByRole('button', { name: 'Guardar cambios' }).click()
  const tarjetaCategoriaEditada = page.locator('[data-slot="card"]', {
    hasText: nombreCategoriaEditada,
  })
  await expect(tarjetaCategoriaEditada).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/categorias-03-tras-editar-categoria.png' })

  await tarjetaCategoriaEditada.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaCategoriaEditada.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaCategoriaEditada.locator('li', { hasText: nombreSubcategoria })).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/categorias-04-tras-crear-subcategoria.png' })

  await tarjetaCategoriaEditada
    .locator('li', { hasText: nombreSubcategoria })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(tarjetaCategoriaEditada.locator('li', { hasText: nombreSubcategoria })).toHaveCount(
    0,
  )

  await tarjetaCategoriaEditada.getByRole('button', { name: 'Eliminar categoría' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaEditada })).toHaveCount(
    0,
  )
  await page.screenshot({ path: 'e2e/capturas/categorias-05-tras-eliminar.png' })
})
