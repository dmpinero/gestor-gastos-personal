import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { formatearImporte } from '@/lib/formato'
import ListaTotalesCategoria from '../ListaTotalesCategoria.vue'

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

  it('sin descripcionesPorCategoria, el title cae de vuelta al nombre completo e importe', () => {
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
  })

  it('con descripcionesPorCategoria, el title muestra la descripción de cada movimiento', () => {
    const wrapper = mount(ListaTotalesCategoria, {
      props: {
        titulo: 'Gastos por categoría',
        items: [{ categoria_id: 1, nombre: 'Servicios', total: '-45.00' }],
        acento: 'gasto',
        mensajeVacio: 'No hay gastos registrados todavía.',
        descripcionesPorCategoria: {
          1: [
            `Pago en PELUQUERIA LAS ROZAS DE ES: ${formatearImporte('-45.00')}`,
            `Otro pago: ${formatearImporte('-5.00')}`,
          ],
        },
      },
    })

    const fila = wrapper.get('li')
    expect(fila.attributes('title')).toBe(
      `Pago en PELUQUERIA LAS ROZAS DE ES: ${formatearImporte('-45.00')}\nOtro pago: ${formatearImporte('-5.00')}`,
    )
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
