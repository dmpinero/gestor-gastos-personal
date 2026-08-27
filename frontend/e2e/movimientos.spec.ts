import { test, expect } from '@playwright/test'
import {
  elegirCuentaDelFormulario,
  elegirOpcion,
  seleccionarCategoria,
  seleccionarCategorias,
  seleccionarCuenta,
  seleccionarCuentas,
  seleccionarSubcategoria,
  seleccionarSubcategorias,
} from './utilidades'

test('gestión completa de un movimiento: crear, editar y eliminar', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV ${sufijo}`
  const nombreCategoria = `Categoria MOV ${sufijo}`
  const descripcion = `Movimiento E2E ${sufijo}`

  // Preparación: una cuenta y una categoría propias de este test.
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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)
  await page.screenshot({ path: 'e2e/capturas/movimientos-01-listado-inicial.png' })

  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  await panel.locator('input[type="date"]').fill('2026-01-15')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await panel.getByPlaceholder('Descripción').fill(descripcion)
  await panel.getByPlaceholder('Importe').fill('-42.50')
  await panel.getByPlaceholder('Saldo').fill('957.50')
  await page.screenshot({ path: 'e2e/capturas/movimientos-02-formulario-relleno.png' })

  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  const fila = page.locator('tr', { hasText: descripcion })
  await expect(fila).toBeVisible()
  await expect(fila).toContainText(nombreCategoria)
  await page.screenshot({ path: 'e2e/capturas/movimientos-03-tras-crear.png' })

  await fila.getByRole('button', { name: 'Editar' }).click()
  await panel.getByPlaceholder('Importe').fill('-50.00')
  await panel.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.locator('tr', { hasText: descripcion }).getByText('-50,00 €')).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/movimientos-04-tras-editar.png' })

  await page
    .locator('tr', { hasText: descripcion })
    .getByRole('button', { name: 'Eliminar' })
    .click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.locator('tr', { hasText: descripcion })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/movimientos-05-tras-eliminar.png' })
})

test('crear categoría y subcategoría desde los botones "+" del panel de movimiento, y guardarlo con ellas', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV3 ${sufijo}`
  const nombreCategoria = `Categoria nueva MOV ${sufijo}`
  const nombreSubcategoria = `Subcategoria nueva MOV ${sufijo}`
  const descripcion = `Movimiento con categoria nueva ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  await elegirCuentaDelFormulario(page, panel, numeroCuenta)
  await panel.locator('input[type="date"]').fill('2026-01-20')
  await panel.getByPlaceholder('Descripción').fill(descripcion)
  await panel.getByPlaceholder('Importe').fill('-12.00')
  await panel.getByPlaceholder('Saldo').fill('988.00')

  // Sin categoría elegida, el botón de crear subcategoría está deshabilitado:
  // una subcategoría siempre cuelga de una categoría.
  await expect(panel.getByRole('button', { name: 'Crear subcategoría' })).toBeDisabled()

  await panel.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoriaNueva = page.getByRole('dialog').filter({ hasText: 'Crear categoría' })
  await expect(panelCategoriaNueva).toBeVisible()
  await panelCategoriaNueva.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panelCategoriaNueva.getByRole('button', { name: 'Crear categoría' }).click()
  await expect(panelCategoriaNueva).toBeHidden()
  await expect(panel.getByLabel('Categoría', { exact: true })).toContainText(nombreCategoria)

  await expect(panel.getByRole('button', { name: 'Crear subcategoría' })).toBeEnabled()
  await panel.getByRole('button', { name: 'Crear subcategoría' }).click()
  const panelSubcategoriaNueva = page
    .getByRole('dialog')
    .filter({ hasText: `Nueva subcategoría en "${nombreCategoria}"` })
  await expect(panelSubcategoriaNueva).toBeVisible()
  await panelSubcategoriaNueva.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await panelSubcategoriaNueva.getByRole('button', { name: 'Crear subcategoría' }).click()
  await expect(panelSubcategoriaNueva).toBeHidden()
  await expect(panel.getByLabel('Subcategoría', { exact: true })).toContainText(nombreSubcategoria)

  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  const fila = page.locator('tr', { hasText: descripcion })
  await expect(fila).toBeVisible()
  await expect(fila).toContainText(nombreCategoria)
})

test('la fecha se muestra en formato dd/mm/aaaa, y el buscador y las cabeceras ordenables funcionan', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-ORD ${sufijo}`
  const nombreCategoria = `Categoria MOV-ORD ${sufijo}`
  const descripcionA = `Movimiento Orden A ${sufijo}`
  const descripcionB = `Movimiento Orden B ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  for (const [descripcion, fecha, importe, saldo] of [
    [descripcionA, '2026-01-01', '-10.00', '990.00'],
    [descripcionB, '2026-01-02', '-20.00', '970.00'],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill(fecha)
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill(importe)
    await panel.getByPlaceholder('Saldo').fill(saldo)
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  await expect(page.locator('tr', { hasText: descripcionA })).toContainText('01/01/2026')
  await expect(page.locator('tr', { hasText: descripcionB })).toContainText('02/01/2026')

  const buscador = page.getByLabel('Buscar')
  await buscador.fill(descripcionA)
  await expect(page.locator('tr', { hasText: descripcionA })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionB })).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/movimientos-06-buscador.png' })

  await buscador.fill(`Movimiento Orden`)
  await expect(page.locator('tbody tr').filter({ hasText: sufijo.toString() })).toHaveCount(2)

  const cabeceraDescripcion = page.getByRole('button', { name: 'Descripción' })
  await cabeceraDescripcion.click()
  await expect(page.locator('tbody tr').first()).toContainText(descripcionA)

  await cabeceraDescripcion.click()
  await expect(page.locator('tbody tr').first()).toContainText(descripcionB)
  await page.screenshot({ path: 'e2e/capturas/movimientos-07-ordenado.png' })
})

test('la tabla se pagina, permite cambiar el tamaño de página y muestra el total de registros', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-PAG ${sufijo}`
  const nombreCategoria = `Categoria MOV-PAG ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  for (let i = 1; i <= 11; i++) {
    const descripcion = `Movimiento PAG-${i} ${sufijo}`
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill('2026-01-01')
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill('-1.00')
    await panel.getByPlaceholder('Saldo').fill('100.00')
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  await expect(page.getByText('Mostrando 1–10 de 11 movimientos')).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(10)

  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page.getByText('Mostrando 11–11 de 11 movimientos')).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(1)

  await page.getByLabel('Elementos por página').click()
  await page.getByRole('option', { name: 'Todas' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(11)
})

test('seleccionar varios movimientos y eliminarlos en bloque', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-BLOQUE ${sufijo}`
  const nombreCategoria = `Categoria MOV-BLOQUE ${sufijo}`
  const descripcionA = `Movimiento bloque A ${sufijo}`
  const descripcionB = `Movimiento bloque B ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  for (const [descripcion, fecha, importe, saldo] of [
    [descripcionA, '2026-01-01', '-10.00', '990.00'],
    [descripcionB, '2026-01-02', '-20.00', '970.00'],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill(fecha)
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill(importe)
    await panel.getByPlaceholder('Saldo').fill(saldo)
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  await page.locator('tr', { hasText: descripcionA }).getByRole('checkbox').click()
  await page.locator('tr', { hasText: descripcionB }).getByRole('checkbox').click()
  await expect(page.getByText('2 seleccionados')).toBeVisible()

  // Cancelar no debe eliminar nada ni perder la selección.
  await page.getByRole('button', { name: 'Eliminar seleccionados' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('tr', { hasText: descripcionA })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionB })).toBeVisible()
  await expect(page.getByText('2 seleccionados')).toBeVisible()

  await page.getByRole('button', { name: 'Eliminar seleccionados' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()

  await expect(page.locator('tr', { hasText: descripcionA })).toHaveCount(0)
  await expect(page.locator('tr', { hasText: descripcionB })).toHaveCount(0)
})

test('cambiar la categoría y subcategoría de varios movimientos seleccionados a la vez', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-CAT-MASIVO ${sufijo}`
  const nombreCategoriaOrigen = `Categoria origen MASIVO ${sufijo}`
  const nombreCategoriaDestino = `Categoria destino MASIVO ${sufijo}`
  const nombreSubcategoriaDestino = `Subcategoria destino MASIVO ${sufijo}`
  const descripcionA = `Movimiento masivo A ${sufijo}`
  const descripcionB = `Movimiento masivo B ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoria = page.getByRole('dialog')
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoriaOrigen)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoriaOrigen })).toBeVisible()

  await page.getByRole('button', { name: 'Crear categoría' }).click()
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoriaDestino)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  const tarjetaDestino = page.locator('[data-slot="card"]', { hasText: nombreCategoriaDestino })
  await expect(tarjetaDestino).toBeVisible()
  await tarjetaDestino.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoriaDestino)
  await tarjetaDestino.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaDestino.locator('li', { hasText: nombreSubcategoriaDestino })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  for (const [descripcion, fecha, importe, saldo] of [
    [descripcionA, '2026-01-01', '-10.00', '990.00'],
    [descripcionB, '2026-01-02', '-20.00', '970.00'],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill(fecha)
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoriaOrigen)
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill(importe)
    await panel.getByPlaceholder('Saldo').fill(saldo)
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  await page.locator('tr', { hasText: descripcionA }).getByRole('checkbox').click()
  await page.locator('tr', { hasText: descripcionB }).getByRole('checkbox').click()
  await expect(page.getByText('2 seleccionados')).toBeVisible()

  await page.getByRole('button', { name: 'Cambiar categoría' }).click()
  const dialogoCambio = page.getByRole('dialog').filter({ hasText: 'Cambiar categoría de 2' })
  await expect(dialogoCambio).toBeVisible()
  await elegirOpcion(
    page,
    dialogoCambio.getByLabel('Categoría', { exact: true }),
    nombreCategoriaDestino,
  )
  await elegirOpcion(
    page,
    dialogoCambio.getByLabel('Subcategoría', { exact: true }),
    nombreSubcategoriaDestino,
  )
  await dialogoCambio.getByRole('button', { name: 'Aplicar' }).click()
  await expect(dialogoCambio).toBeHidden()

  const filaA = page.locator('tr', { hasText: descripcionA })
  const filaB = page.locator('tr', { hasText: descripcionB })
  await expect(filaA).toContainText(nombreCategoriaDestino)
  await expect(filaA).toContainText(nombreSubcategoriaDestino)
  await expect(filaB).toContainText(nombreCategoriaDestino)
  await expect(filaB).toContainText(nombreSubcategoriaDestino)
})

test('el selector de cuenta funciona dentro de la barra de filtros y recarga movimientos al cambiar de cuenta', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuentaA = `ES00 MOV-CTA-A ${sufijo}`
  const numeroCuentaB = `ES00 MOV-CTA-B ${sufijo}`
  const nombreCategoria = `Categoria MOV-CTA ${sufijo}`
  const descripcionA = `Pago origen A ${sufijo}`
  const descripcionB = `Pago origen B ${sufijo}`

  await page.goto('/gestion/cuentas')
  for (const numeroCuenta of [numeroCuentaA, numeroCuentaB]) {
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const panelCuenta = page.getByRole('dialog')
    await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
    await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()
  }

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoria = page.getByRole('dialog')
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  for (const [numeroCuenta, descripcion] of [
    [numeroCuentaA, descripcionA],
    [numeroCuentaB, descripcionB],
  ]) {
    await seleccionarCuenta(page, numeroCuenta)
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill('2026-01-01')
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill('-5.00')
    await panel.getByPlaceholder('Saldo').fill('995.00')
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  // Con la cuenta B activa (última seleccionada) solo se ve su movimiento.
  await expect(page.locator('tr', { hasText: descripcionB })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionA })).toHaveCount(0)

  // El selector de cuenta, ya dentro de la barra de filtros, sigue disparando
  // una recarga real de movimientos al cambiar de cuenta.
  await seleccionarCuenta(page, numeroCuentaA)
  await expect(page.locator('tr', { hasText: descripcionA })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionB })).toHaveCount(0)
})

test('los filtros de fecha, importe, categoría y subcategoría se combinan entre sí y con el texto libre, y "Limpiar filtros" los resetea', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-FILTROS ${sufijo}`
  const nombreCategoria = `Categoria MOV-FILTROS ${sufijo}`
  const nombreSubcategoria = `Subcategoria MOV-FILTROS ${sufijo}`
  const descripcionObjetivo = `Objetivo filtro ${sufijo}`
  const descripcionFueraImporte = `Fuera de rango importe ${sufijo}`
  const descripcionFueraFecha = `Fuera de rango fecha ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  for (const [descripcion, fecha, importe] of [
    [descripcionObjetivo, '2026-03-01', '-15.00'],
    [descripcionFueraImporte, '2026-03-02', '-200.00'],
    [descripcionFueraFecha, '2026-04-01', '-15.00'],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill(fecha)
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await elegirOpcion(page, panel.getByLabel('Subcategoría', { exact: true }), nombreSubcategoria)
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill(importe)
    await panel.getByPlaceholder('Saldo').fill('985.00')
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  await page.getByLabel('Fecha desde').fill('2026-03-01')
  await page.getByLabel('Fecha hasta').fill('2026-03-15')
  await seleccionarCategoria(page, nombreCategoria)
  await seleccionarSubcategoria(page, nombreSubcategoria)
  await page.getByLabel('Importe mínimo').fill('-50')
  await page.getByLabel('Importe máximo').fill('0')
  await page.getByLabel('Buscar').fill('Objetivo')
  await page.screenshot({ path: 'e2e/capturas/movimientos-08-filtros-combinados.png' })

  await expect(page.locator('tr', { hasText: descripcionObjetivo })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionFueraImporte })).toHaveCount(0)
  await expect(page.locator('tr', { hasText: descripcionFueraFecha })).toHaveCount(0)

  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
  await expect(page.locator('tr', { hasText: descripcionObjetivo })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionFueraImporte })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionFueraFecha })).toBeVisible()
})

test('el área de filtros se puede contraer y expandir', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-COLAPSO ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  await expect(page.getByLabel('Buscar')).toBeVisible()
  await expect(page.getByLabel('Fecha desde')).toBeVisible()

  await page.getByRole('button', { name: 'Contraer filtros' }).click()
  await expect(page.getByLabel('Buscar')).toBeHidden()
  await expect(page.getByLabel('Fecha desde')).toBeHidden()

  await page.getByRole('button', { name: 'Expandir filtros' }).click()
  await expect(page.getByLabel('Buscar')).toBeVisible()
  await expect(page.getByLabel('Fecha desde')).toBeVisible()
})

test('"Mes anterior"/"Mes siguiente" solo aparecen cuando el rango es un mes completo, y desplazan el filtro', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-MES ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  const fechaDesde = page.getByLabel('Fecha desde')
  const fechaHasta = page.getByLabel('Fecha hasta')
  const botonMesAnterior = page.getByRole('button', { name: 'Mes anterior' })
  const botonMesSiguiente = page.getByRole('button', { name: 'Mes siguiente' })

  // Sin fechas, no hay botones.
  await expect(botonMesAnterior).toBeHidden()
  await expect(botonMesSiguiente).toBeHidden()

  // Rango parcial (no empieza el día 1): tampoco.
  await fechaDesde.fill('2026-02-05')
  await fechaHasta.fill('2026-02-28')
  await expect(botonMesAnterior).toBeHidden()
  await expect(botonMesSiguiente).toBeHidden()

  // Mes completo (febrero 2026, no bisiesto: 1 al 28): aparecen los botones.
  await fechaDesde.fill('2026-02-01')
  await fechaHasta.fill('2026-02-28')
  await expect(botonMesAnterior).toBeVisible()
  await expect(botonMesSiguiente).toBeVisible()

  await botonMesSiguiente.click()
  await expect(fechaDesde).toHaveValue('2026-03-01')
  await expect(fechaHasta).toHaveValue('2026-03-31')
  // Los botones se mantienen visibles tras el desplazamiento (el nuevo rango
  // también es un mes completo).
  await expect(botonMesAnterior).toBeVisible()
  await expect(botonMesSiguiente).toBeVisible()

  await botonMesAnterior.click()
  await botonMesAnterior.click()
  // De marzo 2026 retrocediendo dos veces: enero 2026 (cruzando febrero).
  await expect(fechaDesde).toHaveValue('2026-01-01')
  await expect(fechaHasta).toHaveValue('2026-01-31')

  // Retroceder una vez más cruza el cambio de año: diciembre 2025.
  await botonMesAnterior.click()
  await expect(fechaDesde).toHaveValue('2025-12-01')
  await expect(fechaHasta).toHaveValue('2025-12-31')

  // Editar una fecha manualmente rompiendo el mes completo oculta los botones.
  await fechaHasta.fill('2026-01-15')
  await expect(botonMesAnterior).toBeHidden()
  await expect(botonMesSiguiente).toBeHidden()
})

test('el resumen muestra el total y la evolución de gastos e ingresos por separado', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-RESUMEN ${sufijo}`
  const nombreCategoria = `Categoria MOV-RESUMEN ${sufijo}`
  const descripcionGasto = `Gasto resumen ${sufijo}`
  const descripcionIngreso = `Ingreso resumen ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  for (const [descripcion, importe] of [
    [descripcionGasto, '-30.00'],
    [descripcionIngreso, '1000.00'],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill('2026-01-15')
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill(importe)
    await panel.getByPlaceholder('Saldo').fill('970.00')
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  await expect(page.getByText('Total gastado')).toBeVisible()
  const tarjetaGastado = page.locator('[data-slot="card"]', { hasText: 'Total gastado' })
  await expect(tarjetaGastado).toContainText('-30,00 €')

  await tarjetaGastado.getByRole('button', { name: 'Detalles' }).click()
  const modalGastado = page.getByRole('dialog')
  await expect(modalGastado).toContainText('Total gastado')
  await expect(modalGastado).toContainText('1 movimiento')
  await expect(modalGastado).toContainText(descripcionGasto)
  await expect(modalGastado).not.toContainText(descripcionIngreso)
  await page.screenshot({ path: 'e2e/capturas/movimientos-10-detalle-total-gastado.png' })

  // Editar desde dentro de la modal de detalle (anidamiento Dialog→Sheet): el
  // panel de edición se abre por delante sin cerrar la modal, y al guardar la
  // tarjeta "Total gastado" refleja el nuevo importe al momento.
  await modalGastado
    .locator('tbody tr', { hasText: descripcionGasto })
    .getByRole('button', { name: 'Editar' })
    .click()
  const panelEdicionDetalle = page.getByRole('dialog').filter({ hasText: 'Editar movimiento' })
  await expect(panelEdicionDetalle).toBeVisible()
  await expect(modalGastado).toBeVisible()
  await panelEdicionDetalle.getByPlaceholder('Importe').fill('-40.00')
  await panelEdicionDetalle.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(panelEdicionDetalle).toBeHidden()
  await expect(tarjetaGastado).toContainText('-40,00 €')
  await expect(modalGastado).toContainText('-40,00 €')

  // "Agrupar por categoría" también funciona dentro de esta modal.
  await modalGastado.getByRole('button', { name: 'Agrupar por categoría' }).click()
  await expect(modalGastado.locator('table')).toHaveCount(0)
  await expect(modalGastado).toContainText(nombreCategoria)
  await expect(modalGastado).toContainText('-40,00 €')
  await modalGastado.getByRole('button', { name: 'Ver todos los movimientos' }).click()
  await expect(modalGastado.locator('table')).toBeVisible()

  await modalGastado.getByRole('button', { name: 'Cerrar' }).click()

  const tarjetaIngresado = page.locator('[data-slot="card"]', { hasText: 'Total ingresado' })
  await expect(tarjetaIngresado).toContainText('1000,00 €')

  await tarjetaIngresado.getByRole('button', { name: 'Detalles' }).click()
  const modalIngresado = page.getByRole('dialog')
  await expect(modalIngresado).toContainText('Total ingresado')
  await expect(modalIngresado).toContainText(descripcionIngreso)
  await expect(modalIngresado).not.toContainText(descripcionGasto)
  await modalIngresado.getByRole('button', { name: 'Cerrar' }).click()

  // Saldo = -40,00 + 1000,00 = 960,00 € (el gasto se editó de -30 a -40 más
  // arriba), positivo → verde.
  const tarjetaSaldo = page.locator('[data-slot="card"]', { hasText: 'Saldo' })
  await expect(tarjetaSaldo).toContainText('960,00 €')
  await expect(tarjetaSaldo.locator('[data-slot="card-content"]')).toHaveClass(/text-success/)

  await expect(page.getByText('Evolución de gastos', { exact: true })).toBeVisible()
  await expect(page.getByText('Evolución de ingresos', { exact: true })).toBeVisible()
})

test('el saldo se muestra en rojo cuando el total de gastos supera al de ingresos', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-SALDO-NEG ${sufijo}`
  const nombreCategoria = `Categoria MOV-SALDO-NEG ${sufijo}`
  const descripcionGasto = `Gasto saldo negativo ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill('2026-01-15')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await panel.getByPlaceholder('Descripción').fill(descripcionGasto)
  await panel.getByPlaceholder('Importe').fill('-50.00')
  await panel.getByPlaceholder('Saldo').fill('950.00')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: descripcionGasto })).toBeVisible()

  const tarjetaSaldo = page.locator('[data-slot="card"]', { hasText: 'Saldo' })
  await expect(tarjetaSaldo).toContainText('-50,00 €')
  await expect(tarjetaSaldo.locator('[data-slot="card-content"]')).toHaveClass(/text-destructive/)
})

test('el gráfico de evolución se puede ver como distribución circular', async ({ page }) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-CIRCULAR ${sufijo}`
  const nombreCategoria = `Categoria MOV-CIRCULAR ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  for (const [fecha, importe] of [
    ['2026-01-05', '-30.00'],
    ['2026-02-05', '-10.00'],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill(fecha)
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await panel.getByPlaceholder('Descripción').fill(`Gasto ${fecha}`)
    await panel.getByPlaceholder('Importe').fill(importe)
    await panel.getByPlaceholder('Saldo').fill('970.00')
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: `Gasto ${fecha}` })).toBeVisible()
  }

  await page.getByRole('button', { name: 'Ver como circular' }).first().click()
  await expect(page.getByText('75%')).toBeVisible()
  await expect(page.getByText('25%')).toBeVisible()
})

test('el gráfico comparativo de gastos vs ingresos muestra la evolución de ambos juntos', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-VS ${sufijo}`
  const nombreCategoria = `Categoria MOV-VS ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  // Con un único gasto y ningún ingreso, la comparativa no debe aparecer
  // (no hay nada que comparar).
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  let panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill('2026-01-05')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await panel.getByPlaceholder('Descripción').fill('Solo gasto')
  await panel.getByPlaceholder('Importe').fill('-30.00')
  await panel.getByPlaceholder('Saldo').fill('970.00')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: 'Solo gasto' })).toBeVisible()
  await expect(page.getByText('Evolución de gastos vs ingresos')).toBeHidden()

  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill('2026-01-10')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await panel.getByPlaceholder('Descripción').fill('Con ingreso')
  await panel.getByPlaceholder('Importe').fill('500.00')
  await panel.getByPlaceholder('Saldo').fill('970.00')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  await expect(page.locator('tr', { hasText: 'Con ingreso' })).toBeVisible()

  const comparativa = page.getByText('Evolución de gastos vs ingresos')
  await expect(comparativa).toBeVisible()
  const zonaComparativa = comparativa.locator('..')

  // El modo barras (por defecto) muestra el importe de cada serie.
  const barrasComparativa = zonaComparativa.locator('[role="group"]')
  await expect(barrasComparativa.getByText('30,00 €')).toBeVisible()
  await expect(barrasComparativa.getByText('500,00 €')).toBeVisible()

  // Debajo, una tabla a ancho completo con el saldo del mes (500 - 30 = 470, verde).
  const tablaSaldoComparativa = zonaComparativa.locator('table')
  await expect(tablaSaldoComparativa).toBeVisible()
  const filaSaldoComparativa = tablaSaldoComparativa.locator('tbody tr').first()
  await expect(filaSaldoComparativa).toContainText('470,00 €')
  await expect(filaSaldoComparativa.locator('td').nth(1)).toHaveClass(/text-success/)
  await page.screenshot({ path: 'e2e/capturas/movimientos-11-comparativa-saldo-mes.png' })

  // Debajo, el top 10 por categoría de cada serie.
  await expect(page.getByText('Top 10 gastos por categoría')).toBeVisible()
  await expect(page.getByText('Top 10 ingresos por categoría')).toBeVisible()
  const filaTopGasto = page.locator('li', { hasText: nombreCategoria }).first()
  const filaTopIngreso = page.locator('li', { hasText: nombreCategoria }).last()
  await expect(filaTopGasto).toContainText('-30,00 €')
  await expect(filaTopIngreso).toContainText('500,00 €')

  // El title (tooltip nativo al pasar el ratón) muestra la descripción de
  // cada movimiento que compone el total de la categoría, no solo su nombre.
  await expect(filaTopGasto).toHaveAttribute('title', 'Solo gasto: -30,00 €')
  await expect(filaTopIngreso).toHaveAttribute('title', 'Con ingreso: 500,00 €')

  // El enlace "Detalles" abre una modal con la misma información en tabla,
  // más fecha, categoría y subcategoría, y con iconos para exportar.
  await filaTopGasto.getByRole('button', { name: 'Detalles' }).click()
  const modalDetalle = page.getByRole('dialog').filter({ hasText: nombreCategoria })
  await expect(modalDetalle).toBeVisible()
  await expect(modalDetalle.getByRole('columnheader', { name: 'Fecha' })).toBeVisible()
  await expect(
    modalDetalle.getByRole('columnheader', { name: 'Categoría', exact: true }),
  ).toBeVisible()
  await expect(modalDetalle.getByRole('columnheader', { name: 'Subcategoría' })).toBeVisible()
  await expect(modalDetalle.getByRole('cell', { name: 'Solo gasto' })).toBeVisible()

  // Editar desde el Top 10 por categoría (segundo caso de anidamiento
  // Dialog→Sheet): el panel se abre por delante sin cerrar la modal de
  // detalle, y al guardar el nuevo importe se refleja en ambas.
  await modalDetalle
    .locator('tbody tr', { hasText: 'Solo gasto' })
    .getByRole('button', { name: 'Editar' })
    .click()
  const panelEdicionTop10 = page.getByRole('dialog').filter({ hasText: 'Editar movimiento' })
  await expect(panelEdicionTop10).toBeVisible()
  await expect(modalDetalle).toBeVisible()
  await panelEdicionTop10.getByPlaceholder('Importe').fill('-35.00')
  await panelEdicionTop10.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(panelEdicionTop10).toBeHidden()
  await expect(modalDetalle).toContainText('-35,00 €')
  await expect(filaTopGasto).toContainText('-35,00 €')

  const nombreCategoriaEscapado = nombreCategoria.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patronMarcaTemporal = /_\d{8}_\d{6}/.source

  const [descargaExcel] = await Promise.all([
    page.waitForEvent('download'),
    modalDetalle.getByRole('button', { name: 'Exportar a Excel' }).click(),
  ])
  expect(descargaExcel.suggestedFilename()).toMatch(
    new RegExp(`^${nombreCategoriaEscapado}${patronMarcaTemporal}\\.xlsx$`),
  )

  const [descargaPdf] = await Promise.all([
    page.waitForEvent('download'),
    modalDetalle.getByRole('button', { name: 'Exportar a PDF' }).click(),
  ])
  expect(descargaPdf.suggestedFilename()).toMatch(
    new RegExp(`^${nombreCategoriaEscapado}${patronMarcaTemporal}\\.pdf$`),
  )

  await page.keyboard.press('Escape')
  await expect(modalDetalle).toBeHidden()

  // Modo líneas: aparece una tercera línea con el saldo del mes (500 - 35 =
  // 465), y una leyenda con 3 chips para elegir qué series ver.
  await zonaComparativa.getByRole('button', { name: 'Ver como líneas' }).click()
  const svgComparativa = zonaComparativa.locator('svg[role="img"]')
  await expect(svgComparativa).toBeVisible()
  await expect(svgComparativa.getByText('465,00 €')).toBeVisible()
  await expect(svgComparativa.locator('circle')).toHaveCount(3) // gasto, ingreso, saldo
  await page.screenshot({ path: 'e2e/capturas/movimientos-14-comparativa-lineas-saldo.png' })

  // Ocultar "Gastos" deja solo ingreso y saldo dibujados.
  await zonaComparativa.getByRole('button', { name: 'Ocultar gastos' }).click()
  await expect(svgComparativa.locator('polyline')).toHaveCount(2)
  await expect(svgComparativa.locator('circle')).toHaveCount(2)

  await zonaComparativa.getByRole('button', { name: 'Mostrar gastos' }).click()
  await expect(svgComparativa.locator('polyline')).toHaveCount(3)

  await zonaComparativa.getByRole('button', { name: 'Ver como circular' }).click()
  const listaCircular = zonaComparativa.locator('ul').first()
  await expect(listaCircular.getByText('Gastos', { exact: true })).toBeVisible()
  await expect(listaCircular.getByText('Ingresos', { exact: true })).toBeVisible()
})

test('las zonas de gráficos y de resultados se pueden contraer y expandir de forma independiente', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-ZONAS ${sufijo}`
  const nombreCategoria = `Categoria MOV-ZONAS ${sufijo}`
  const descripcion = `Movimiento zonas ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill('2026-01-15')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await panel.getByPlaceholder('Descripción').fill(descripcion)
  await panel.getByPlaceholder('Importe').fill('-30.00')
  await panel.getByPlaceholder('Saldo').fill('970.00')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()
  const fila = page.locator('tr', { hasText: descripcion })
  await expect(fila).toBeVisible()

  await expect(page.getByText('Total gastado')).toBeVisible()
  await page.getByRole('button', { name: 'Contraer gráficos' }).click()
  await expect(page.getByText('Total gastado')).toBeHidden()
  // La zona de resultados no se ve afectada al contraer la de gráficos.
  await expect(fila).toBeVisible()

  await page.getByRole('button', { name: 'Expandir gráficos' }).click()
  await expect(page.getByText('Total gastado')).toBeVisible()

  await page.getByRole('button', { name: 'Contraer resultados' }).click()
  await expect(fila).toBeHidden()
  // La zona de gráficos no se ve afectada al contraer la de resultados.
  await expect(page.getByText('Total gastado')).toBeVisible()

  await page.getByRole('button', { name: 'Expandir resultados' }).click()
  await expect(fila).toBeVisible()
})

test('el filtro de cuenta permite seleccionar varias cuentas a la vez, mostrando su columna Cuenta', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuentaA = `ES00 MULTI-A ${sufijo}`
  const numeroCuentaB = `ES00 MULTI-B ${sufijo}`
  const numeroCuentaC = `ES00 MULTI-C ${sufijo}`
  const nombreCategoria = `Categoria MULTI ${sufijo}`
  const descripcionA = `Movimiento multi A ${sufijo}`
  const descripcionB = `Movimiento multi B ${sufijo}`
  const descripcionC = `Movimiento multi C ${sufijo}`

  await page.goto('/gestion/cuentas')
  for (const numeroCuenta of [numeroCuentaA, numeroCuentaB, numeroCuentaC]) {
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const panelCuenta = page.getByRole('dialog')
    await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
    await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()
  }

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoria = page.getByRole('dialog')
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  for (const [numeroCuenta, descripcion] of [
    [numeroCuentaA, descripcionA],
    [numeroCuentaB, descripcionB],
    [numeroCuentaC, descripcionC],
  ]) {
    await seleccionarCuenta(page, numeroCuenta)
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill('2026-01-15')
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill('-1.00')
    await panel.getByPlaceholder('Saldo').fill('99.00')
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  // Con solo la cuenta C activa (última seleccionada), no se ven A ni B.
  await expect(page.locator('tr', { hasText: descripcionC })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionA })).toHaveCount(0)
  await expect(page.locator('tr', { hasText: descripcionB })).toHaveCount(0)

  // Se marcan A y B a la vez (sin tocar C, que se desmarca): deben verse los
  // movimientos de ambas, cada uno con su propia cuenta en la columna Cuenta.
  await seleccionarCuentas(page, [numeroCuentaA, numeroCuentaB])

  const filaA = page.locator('tr', { hasText: descripcionA })
  const filaB = page.locator('tr', { hasText: descripcionB })
  await expect(filaA).toBeVisible()
  await expect(filaB).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcionC })).toHaveCount(0)
  await expect(filaA).toContainText(numeroCuentaA)
  await expect(filaB).toContainText(numeroCuentaB)
})

test('al crear un movimiento se puede elegir explícitamente la cuenta en el panel', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuentaA = `ES00 PANEL-A ${sufijo}`
  const numeroCuentaB = `ES00 PANEL-B ${sufijo}`
  const nombreCategoria = `Categoria PANEL ${sufijo}`
  const descripcion = `Movimiento panel cuenta B ${sufijo}`

  await page.goto('/gestion/cuentas')
  for (const numeroCuenta of [numeroCuentaA, numeroCuentaB]) {
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    const panelCuenta = page.getByRole('dialog')
    await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
    await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()
  }

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panelCategoria = page.getByRole('dialog')
  await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  // El filtro deja la cuenta A preseleccionada en el panel por defecto, pero
  // el movimiento se crea explícitamente para la cuenta B.
  await seleccionarCuenta(page, numeroCuentaA)
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await elegirCuentaDelFormulario(page, panel, numeroCuentaB)
  await panel.locator('input[type="date"]').fill('2026-01-15')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await panel.getByPlaceholder('Descripción').fill(descripcion)
  await panel.getByPlaceholder('Importe').fill('-1.00')
  await panel.getByPlaceholder('Saldo').fill('99.00')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()

  // Con la cuenta A activa en el filtro no se ve (se creó para B).
  await expect(page.locator('tr', { hasText: descripcion })).toHaveCount(0)

  await seleccionarCuenta(page, numeroCuentaB)
  await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
})

test('los filtros de categoría y subcategoría permiten seleccionar varios elementos a la vez', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MULTICAT ${sufijo}`
  const nombreCategoriaX = `Categoria MULTICAT-X ${sufijo}`
  const nombreCategoriaY = `Categoria MULTICAT-Y ${sufijo}`
  const nombreSub1 = `Subcategoria MULTICAT-1 ${sufijo}`
  const nombreSub2 = `Subcategoria MULTICAT-2 ${sufijo}`
  const nombreSub3 = `Subcategoria MULTICAT-3 ${sufijo}`
  const descripcion1 = `Movimiento multicat 1 ${sufijo}`
  const descripcion2 = `Movimiento multicat 2 ${sufijo}`
  const descripcion3 = `Movimiento multicat 3 ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  for (const [nombreCategoria, subcategorias] of [
    [nombreCategoriaX, [nombreSub1, nombreSub2]],
    [nombreCategoriaY, [nombreSub3]],
  ] as const) {
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    const panelCategoria = page.getByRole('dialog')
    await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
    await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
    const tarjetaCategoria = page.locator('[data-slot="card"]', { hasText: nombreCategoria })
    await expect(tarjetaCategoria).toBeVisible()
    for (const nombreSubcategoria of subcategorias) {
      await tarjetaCategoria.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
      await tarjetaCategoria.getByRole('button', { name: 'Añadir' }).click()
      await expect(tarjetaCategoria.locator('li', { hasText: nombreSubcategoria })).toBeVisible()
    }
  }

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)
  for (const [descripcion, nombreCategoria, nombreSubcategoria] of [
    [descripcion1, nombreCategoriaX, nombreSub1],
    [descripcion2, nombreCategoriaX, nombreSub2],
    [descripcion3, nombreCategoriaY, nombreSub3],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill('2026-01-15')
    await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
    await elegirOpcion(page, panel.getByLabel('Subcategoría', { exact: true }), nombreSubcategoria)
    await panel.getByPlaceholder('Descripción').fill(descripcion)
    await panel.getByPlaceholder('Importe').fill('-1.00')
    await panel.getByPlaceholder('Saldo').fill('99.00')
    await panel.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  // Solo la categoría X activa: se ven 1 y 2, no 3 (categoría Y).
  await seleccionarCategoria(page, nombreCategoriaX)
  await expect(page.locator('tr', { hasText: descripcion1 })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcion2 })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcion3 })).toHaveCount(0)

  // Dentro de la categoría X, solo la subcategoría 1: no se ve el 2.
  await seleccionarSubcategoria(page, nombreSub1)
  await expect(page.locator('tr', { hasText: descripcion1 })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcion2 })).toHaveCount(0)

  // Se marcan ambas subcategorías de la categoría X: vuelven a verse las dos.
  await seleccionarSubcategorias(page, [nombreSub1, nombreSub2])
  await expect(page.locator('tr', { hasText: descripcion1 })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcion2 })).toBeVisible()
  await expect(page.locator('tr', { hasText: descripcion3 })).toHaveCount(0)

  // Se marcan ambas categorías de nuevo: reaparece el movimiento de Y.
  await seleccionarCategorias(page, [nombreCategoriaX, nombreCategoriaY])
  await expect(page.locator('tr', { hasText: descripcion3 })).toBeVisible()
})

test('"Agrupar por categoría" muestra totales por categoría/subcategoría, y permite editar desde ahí', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 MOV-AGRUP ${sufijo}`
  const nombreCategoriaX = `Categoria MOV-AGRUP-X ${sufijo}`
  const nombreCategoriaY = `Categoria MOV-AGRUP-Y ${sufijo}`
  const nombreSubcategoria = `Subcategoria MOV-AGRUP ${sufijo}`
  const descripcionGastoConSub = `Gasto con sub ${sufijo}`
  const descripcionIngresoConSub = `Ingreso con sub ${sufijo}`
  const descripcionSinSub = `Gasto sin sub ${sufijo}`
  const descripcionOtraCategoria = `Gasto otra categoría ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panelCuenta = page.getByRole('dialog')
  await panelCuenta.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panelCuenta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()

  await page.goto('/gestion/categorias')
  for (const nombreCategoria of [nombreCategoriaX, nombreCategoriaY]) {
    await page.getByRole('button', { name: 'Crear categoría' }).click()
    const panelCategoria = page.getByRole('dialog')
    await panelCategoria.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
    await panelCategoria.getByRole('button', { name: 'Crear categoría' }).click()
    await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()
  }
  const tarjetaCategoriaX = page.locator('[data-slot="card"]', { hasText: nombreCategoriaX })
  await tarjetaCategoriaX.getByPlaceholder('Nueva subcategoría').fill(nombreSubcategoria)
  await tarjetaCategoriaX.getByRole('button', { name: 'Añadir' }).click()
  await expect(tarjetaCategoriaX.locator('li', { hasText: nombreSubcategoria })).toBeVisible()

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)

  async function crear(
    nombreCategoria: string,
    subcategoria: string | null,
    descripcion: string,
    importe: string,
  ): Promise<void> {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panel = page.getByRole('dialog')
    await panel.locator('input[type="date"]').fill('2026-01-01')
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

  await crear(nombreCategoriaX, nombreSubcategoria, descripcionGastoConSub, '-20.00')
  await crear(nombreCategoriaX, nombreSubcategoria, descripcionIngresoConSub, '50.00')
  await crear(nombreCategoriaX, null, descripcionSinSub, '-10.00')
  await crear(nombreCategoriaY, null, descripcionOtraCategoria, '-5.00')

  // La tabla plana de Resultados (identificada por su checkbox "seleccionar
  // todos") desaparece; no se puede comprobar con "no hay ninguna <table> en
  // la página" porque la tabla de saldo de "Evolución de gastos vs ingresos"
  // (ver más abajo) es independiente de este toggle y sigue visible.
  const checkboxSeleccionarTodos = page.getByRole('checkbox', {
    name: 'Seleccionar todos los movimientos',
  })
  await page.getByRole('button', { name: 'Agrupar por categoría' }).click()
  await expect(checkboxSeleccionarTodos).toHaveCount(0)
  await page.screenshot({ path: 'e2e/capturas/movimientos-12-agrupado-por-categoria.png' })

  const filaCategoriaX = page.locator('button[aria-expanded]', { hasText: nombreCategoriaX })
  await expect(filaCategoriaX).toContainText('-30,00 €') // -20 - 10
  await expect(filaCategoriaX).toContainText('50,00 €')
  await expect(filaCategoriaX).toContainText('3 mov.')

  const filaCategoriaY = page.locator('button[aria-expanded]', { hasText: nombreCategoriaY })
  await expect(filaCategoriaY).toContainText('-5,00 €')
  await expect(filaCategoriaY).toContainText('1 mov.')

  await filaCategoriaX.click()
  const filaSubcategoria = page.locator('button[aria-expanded]', { hasText: nombreSubcategoria })
  await expect(filaSubcategoria).toContainText('-20,00 €')
  await expect(filaSubcategoria).toContainText('50,00 €')
  await expect(filaSubcategoria).toContainText('2 mov.')
  const filaSinSubcategoria = page.locator('button[aria-expanded]', {
    hasText: '(sin subcategoría)',
  })
  await expect(filaSinSubcategoria).toContainText('-10,00 €')
  await expect(filaSinSubcategoria).toContainText('1 mov.')

  await filaSubcategoria.click()
  await expect(page.locator('table', { hasText: descripcionGastoConSub })).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/movimientos-13-agrupado-subcategoria-expandida.png' })

  // Editar un movimiento desde dentro de la vista agrupada actualiza el total.
  const filaMovimiento = page.locator('tbody tr', { hasText: descripcionGastoConSub })
  await filaMovimiento.getByRole('button', { name: 'Editar' }).click()
  const panelEdicion = page.getByRole('dialog').filter({ hasText: 'Editar movimiento' })
  await expect(panelEdicion).toBeVisible()
  await panelEdicion.getByPlaceholder('Importe').fill('-25.00')
  await panelEdicion.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(panelEdicion).toBeHidden()
  await expect(filaSubcategoria).toContainText('-25,00 €')
  await expect(filaCategoriaX).toContainText('-35,00 €') // -25 - 10

  // Volver a la vista plana restaura la tabla y el buscador.
  await page.getByRole('button', { name: 'Ver todos los movimientos' }).click()
  await expect(checkboxSeleccionarTodos).toBeVisible()
  await expect(page.getByPlaceholder('Buscar movimientos…')).toBeVisible()
})

test('el botón de copiar importe deja el importe crudo en el portapapeles, para pegarlo en el Resumen anual', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  const sufijo = Date.now()
  const numeroCuenta = `ES00 COPIAR ${sufijo}`
  const nombreCategoria = `Categoria COPIAR ${sufijo}`
  const descripcion = `Movimiento COPIAR ${sufijo}`

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

  await page.goto('/gestion/movimientos')
  await seleccionarCuenta(page, numeroCuenta)
  await page.getByRole('button', { name: 'Crear movimiento' }).click()
  const panel = page.getByRole('dialog')
  await panel.locator('input[type="date"]').fill('2026-01-15')
  await elegirOpcion(page, panel.getByLabel('Categoría', { exact: true }), nombreCategoria)
  await panel.getByPlaceholder('Descripción').fill(descripcion)
  await panel.getByPlaceholder('Importe').fill('-42.50')
  await panel.getByPlaceholder('Saldo').fill('957.50')
  await panel.getByRole('button', { name: 'Crear movimiento' }).click()

  const fila = page.locator('tr', { hasText: descripcion })
  await expect(fila).toBeVisible()

  // Se copia el importe crudo ("-42.50"), no el texto formateado ("-42,50 €"):
  // es justo lo que espera la celda editable del Resumen anual al pegarlo.
  await fila.getByRole('button', { name: 'Copiar importe -42.50' }).click()
  const textoCopiado = await page.evaluate(() => navigator.clipboard.readText())
  expect(textoCopiado).toBe('-42.50')
})
