import { test, expect } from '@playwright/test'
import { elegirOpcion, seleccionarCuenta } from './utilidades'

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
  await elegirOpcion(page, page.getByLabel('Filtrar por categoría'), nombreCategoria)
  await elegirOpcion(page, page.getByLabel('Filtrar por subcategoría'), nombreSubcategoria)
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
