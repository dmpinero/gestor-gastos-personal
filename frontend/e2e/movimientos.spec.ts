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

  const tarjetaIngresado = page.locator('[data-slot="card"]', { hasText: 'Total ingresado' })
  await expect(tarjetaIngresado).toContainText('1000,00 €')

  await expect(page.getByText('Evolución de gastos', { exact: true })).toBeVisible()
  await expect(page.getByText('Evolución de ingresos', { exact: true })).toBeVisible()
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
