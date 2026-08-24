import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { formatearImporte } from '@/lib/formato'
import { exportarTablaExcel, exportarTablaPDF } from '@/lib/exportarTabla'
import ListaTotalesCategoria from '../ListaTotalesCategoria.vue'

vi.mock('@/lib/exportarTabla', () => ({
  exportarTablaExcel: vi.fn<(...args: unknown[]) => Promise<void>>(),
  exportarTablaPDF: vi.fn<(...args: unknown[]) => void>(),
}))

describe('ListaTotalesCategoria', () => {
  it('muestra el mensaje de vacío cuando no hay elementos', () => {
    const wrapper = mount(ListaTotalesCategoria, {
      props: {
        titulo: 'Gastos por categoría',
        items: [],
        acento: 'gasto',
        mensajeVacio: 'No hay gastos registrados todavía.',
      },
    })

    expect(wrapper.text()).toContain('No hay gastos registrados todavía.')
  })

  it('renderiza una barra por categoría con el importe formateado', () => {
    const wrapper = mount(ListaTotalesCategoria, {
      props: {
        titulo: 'Gastos por categoría',
        items: [
          { categoria_id: 1, nombre: 'Alimentación', total: '-30.00' },
          { categoria_id: 2, nombre: 'Ocio', total: '-10.00' },
        ],
        acento: 'gasto',
        mensajeVacio: 'No hay gastos registrados todavía.',
      },
    })

    const filas = wrapper.findAll('li')
    expect(filas).toHaveLength(2)
    expect(wrapper.text()).toContain('Alimentación')
    expect(wrapper.text()).toContain(formatearImporte('-30.00'))
  })

  it('sin movimientosPorCategoria, el title cae de vuelta al nombre completo e importe, y no hay enlace Detalles', () => {
    const wrapper = mount(ListaTotalesCategoria, {
      props: {
        titulo: 'Gastos por categoría',
        items: [
          { categoria_id: 1, nombre: 'Alimentación y bebidas no alcohólicas', total: '-30.00' },
        ],
        acento: 'gasto',
        mensajeVacio: 'No hay gastos registrados todavía.',
      },
    })

    const fila = wrapper.get('li')
    expect(fila.attributes('title')).toBe(
      `Alimentación y bebidas no alcohólicas: ${formatearImporte('-30.00')}`,
    )
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('con movimientosPorCategoria, el title muestra la descripción de cada movimiento', () => {
    const wrapper = mount(ListaTotalesCategoria, {
      props: {
        titulo: 'Gastos por categoría',
        items: [{ categoria_id: 1, nombre: 'Servicios', total: '-45.00' }],
        acento: 'gasto',
        mensajeVacio: 'No hay gastos registrados todavía.',
        movimientosPorCategoria: {
          1: [
            {
              fecha: '2026-01-05',
              descripcion: 'Pago en PELUQUERIA LAS ROZAS DE ES',
              subcategoria: 'Peluquería',
              importe: '-45.00',
            },
            { fecha: '2026-01-10', descripcion: 'Otro pago', subcategoria: '', importe: '-5.00' },
          ],
        },
      },
    })

    const fila = wrapper.get('li')
    expect(fila.attributes('title')).toBe(
      `Pago en PELUQUERIA LAS ROZAS DE ES: ${formatearImporte('-45.00')}\nOtro pago: ${formatearImporte('-5.00')}`,
    )
  })

  it('con movimientosPorCategoria, el enlace Detalles abre una modal con la tabla de movimientos', async () => {
    const wrapper = mount(ListaTotalesCategoria, {
      attachTo: document.body,
      props: {
        titulo: 'Gastos por categoría',
        items: [{ categoria_id: 1, nombre: 'Servicios', total: '-45.00' }],
        acento: 'gasto',
        mensajeVacio: 'No hay gastos registrados todavía.',
        movimientosPorCategoria: {
          1: [
            {
              fecha: '2026-01-05',
              descripcion: 'Pago en PELUQUERIA LAS ROZAS DE ES',
              subcategoria: 'Peluquería',
              importe: '-45.00',
            },
            { fecha: '2026-01-10', descripcion: 'Otro pago', subcategoria: '', importe: '-5.00' },
          ],
        },
      },
    })

    await wrapper.get('button').trigger('click')

    const modal = document.body.querySelector('[role="dialog"]')
    expect(modal?.textContent).toContain('Servicios')
    expect(modal?.textContent).toContain('05/01/2026')
    expect(modal?.textContent).toContain('Pago en PELUQUERIA LAS ROZAS DE ES')
    expect(modal?.textContent).toContain('Peluquería')
    expect(modal?.textContent).toContain(formatearImporte('-45.00'))
    expect(modal?.textContent).toContain('Otro pago')
    expect(modal?.textContent).toContain(formatearImporte('-5.00'))
    // Iconos de exportar a Excel y a PDF.
    expect(document.body.querySelector('[aria-label="Exportar a Excel"]')).not.toBeNull()
    expect(document.body.querySelector('[aria-label="Exportar a PDF"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('los iconos de exportar llaman a exportarTablaExcel/exportarTablaPDF con los datos de la categoría', async () => {
    const wrapper = mount(ListaTotalesCategoria, {
      attachTo: document.body,
      props: {
        titulo: 'Gastos por categoría',
        items: [{ categoria_id: 1, nombre: 'Servicios', total: '-45.00' }],
        acento: 'gasto',
        mensajeVacio: 'No hay gastos registrados todavía.',
        movimientosPorCategoria: {
          1: [
            {
              fecha: '2026-01-05',
              descripcion: 'Pago en PELUQUERIA LAS ROZAS DE ES',
              subcategoria: 'Peluquería',
              importe: '-45.00',
            },
          ],
        },
      },
    })

    await wrapper.get('button').trigger('click')
    const botonExcel = document.body.querySelector<HTMLElement>('[aria-label="Exportar a Excel"]')
    const botonPdf = document.body.querySelector<HTMLElement>('[aria-label="Exportar a PDF"]')
    botonExcel?.click()
    botonPdf?.click()
    await wrapper.vm.$nextTick()

    const filaEsperada = [
      '05/01/2026',
      'Pago en PELUQUERIA LAS ROZAS DE ES',
      'Servicios',
      'Peluquería',
      formatearImporte('-45.00'),
    ]
    expect(exportarTablaExcel).toHaveBeenCalledWith(
      'Servicios.xlsx',
      ['Fecha', 'Descripción', 'Categoría', 'Subcategoría', 'Importe'],
      [filaEsperada],
    )
    expect(exportarTablaPDF).toHaveBeenCalledWith(
      'Servicios.pdf',
      'Servicios',
      ['Fecha', 'Descripción', 'Categoría', 'Subcategoría', 'Importe'],
      [filaEsperada],
    )
    wrapper.unmount()
  })

  it('la barra de la categoría con mayor importe ocupa el 100% del ancho', () => {
    const wrapper = mount(ListaTotalesCategoria, {
      props: {
        titulo: 'Ingresos por categoría',
        items: [
          { categoria_id: 1, nombre: 'Nómina', total: '1500.00' },
          { categoria_id: 2, nombre: 'Otros', total: '300.00' },
        ],
        acento: 'ingreso',
        mensajeVacio: 'No hay ingresos registrados todavía.',
      },
    })

    const barras = wrapper.findAll('li > div > div')
    expect(barras[0]?.attributes('style')).toContain('width: 100%')
    expect(barras[1]?.attributes('style')).toContain('width: 20%')
  })
})
