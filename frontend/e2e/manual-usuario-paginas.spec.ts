import { test, expect, type Page } from '@playwright/test'
import { elegirOpcion, seleccionarCuenta } from './utilidades'

const BOTON_AYUDA = 'Abrir el manual de usuario interactivo'

async function avanzarHastaTitulo(page: Page, titulo: string, maxPasos = 20): Promise<void> {
  const dialogo = page.getByRole('dialog')
  const cabecera = dialogo.locator('header')
  for (let i = 0; i < maxPasos; i++) {
    if ((await cabecera.textContent()) === titulo) return
    await dialogo.getByRole('button', { name: 'Siguiente', exact: true }).click()
  }
  throw new Error(`No se alcanzó el paso "${titulo}" tras ${maxPasos} clics en "Siguiente"`)
}

async function recorrerHastaElFinal(page: Page, maxPasos = 25): Promise<void> {
  const dialogo = page.getByRole('dialog')
  for (let i = 0; i < maxPasos; i++) {
    const botonTerminar = dialogo.getByRole('button', { name: 'Terminar', exact: true })
    if (await botonTerminar.isVisible()) {
      await botonTerminar.click()
      return
    }
    await dialogo.getByRole('button', { name: 'Siguiente', exact: true }).click()
  }
  throw new Error(`El tour no llegó al último paso tras ${maxPasos} clics`)
}

test('Cuentas: la orientación resalta Gestión, el tour completo no se bloquea, y la selección forzada se restaura al cerrar', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 TOUR-CUENTAS ${sufijo}`

  await page.goto('/gestion/cuentas')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  const panel = page.getByRole('dialog')
  await panel.getByPlaceholder('Número de cuenta').fill(numeroCuenta)
  await panel.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.locator('tr', { hasText: numeroCuenta })).toBeVisible()
  await expect(page.getByText(/seleccionados/)).toHaveCount(0)

  await page.getByRole('button', { name: BOTON_AYUDA }).click()
  await expect(page.getByRole('dialog').locator('header')).toHaveText('Gestión')

  await avanzarHastaTitulo(page, 'Acciones en bloque')
  await expect(page.getByText(/\d+ seleccionados/)).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/manual-usuario-cuentas-seleccion.png' })

  await recorrerHastaElFinal(page)
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByText(/seleccionados/)).toHaveCount(0)
})

test('Categorías: la orientación resalta Gestión, el tour completo no se bloquea, y la selección forzada se restaura al cerrar', async ({
  page,
}) => {
  const sufijo = Date.now()
  const nombreCategoria = `Categoria TOUR ${sufijo}`

  await page.goto('/gestion/categorias')
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  const panel = page.getByRole('dialog')
  await panel.getByPlaceholder('Nueva categoría').fill(nombreCategoria)
  await panel.getByRole('button', { name: 'Crear categoría' }).click()
  await expect(page.locator('[data-slot="card"]', { hasText: nombreCategoria })).toBeVisible()
  await expect(page.getByText(/seleccionados/)).toHaveCount(0)

  await page.getByRole('button', { name: BOTON_AYUDA }).click()
  await expect(page.getByRole('dialog').locator('header')).toHaveText('Gestión')

  await avanzarHastaTitulo(page, 'Acciones en bloque')
  await expect(page.getByText(/\d+ seleccionados/)).toBeVisible()

  await recorrerHastaElFinal(page)
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByText(/seleccionados/)).toHaveCount(0)
})

test('Movimientos: "Mes anterior/siguiente" se resaltan durante el tour, y el filtro de fechas queda vacío al cerrarlo', async ({
  page,
}) => {
  const sufijo = Date.now()
  const numeroCuenta = `ES00 TOUR-MOVIMIENTOS ${sufijo}`
  const nombreCategoria = `Categoria TOUR-MOVIMIENTOS ${sufijo}`
  const descripcionGasto = `Movimiento tour gasto ${sufijo}`
  const descripcionIngreso = `Movimiento tour ingreso ${sufijo}`

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
  for (const [descripcion, importe, saldo] of [
    [descripcionGasto, '-15.00', '985.00'],
    [descripcionIngreso, '20.00', '1005.00'],
  ]) {
    await page.getByRole('button', { name: 'Crear movimiento' }).click()
    const panelMovimiento = page.getByRole('dialog')
    await panelMovimiento.locator('input[type="date"]').fill('2026-01-01')
    await elegirOpcion(
      page,
      panelMovimiento.getByLabel('Categoría', { exact: true }),
      nombreCategoria,
    )
    await panelMovimiento.getByPlaceholder('Descripción').fill(descripcion)
    await panelMovimiento.getByPlaceholder('Importe').fill(importe)
    await panelMovimiento.getByPlaceholder('Saldo').fill(saldo)
    await panelMovimiento.getByRole('button', { name: 'Crear movimiento' }).click()
    await expect(page.locator('tr', { hasText: descripcion })).toBeVisible()
  }

  await expect(page.getByLabel('Fecha desde')).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Mes anterior' })).toHaveCount(0)

  await page.getByRole('button', { name: BOTON_AYUDA }).click()
  await expect(page.getByRole('dialog').locator('header')).toHaveText('Gestión')

  await avanzarHastaTitulo(page, 'Evolución de gastos')
  await expect(page.getByRole('button', { name: 'Ver como circular' }).first()).toBeVisible()
  await avanzarHastaTitulo(page, 'Evolución de ingresos')
  await avanzarHastaTitulo(page, 'Evolución de gastos vs ingresos')
  await page.screenshot({ path: 'e2e/capturas/manual-usuario-movimientos-comparativo.png' })
  await avanzarHastaTitulo(page, 'Top 10 categorías')

  await avanzarHastaTitulo(page, 'Mes anterior / Mes siguiente')
  await expect(page.getByRole('button', { name: 'Mes anterior' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mes siguiente' })).toBeVisible()
  await page.screenshot({ path: 'e2e/capturas/manual-usuario-movimientos-mes-atajos.png' })

  await avanzarHastaTitulo(page, 'Acciones en bloque')
  await expect(page.getByText(/\d+ seleccionados/)).toBeVisible()

  await recorrerHastaElFinal(page)
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByLabel('Fecha desde')).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Mes anterior' })).toHaveCount(0)
  await expect(page.getByText(/seleccionados/)).toHaveCount(0)
})
