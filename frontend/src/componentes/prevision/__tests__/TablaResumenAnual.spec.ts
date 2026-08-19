import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { FilaResumenAnual } from '@/api/tipos'
import TablaResumenAnual from '../TablaResumenAnual.vue'

function crearFila(): FilaResumenAnual {
  return {
    concepto_id: 1,
    categoria_id: 1,
    subcategoria_id: null,
    nombre: 'Amazon Prime',
    periodicidad: 'mensual',
    valores: Array.from({ length: 12 }, (_, indice) => ({
      mes: indice + 1,
      importe: '-9.99',
      origen: 'previsto' as const,
    })).map((valor, indice) => {
      if (indice === 2) return { ...valor, importe: '-4.99', origen: 'real' as const }
      if (indice === 4) return { ...valor, importe: '-1.00', origen: 'ajustado' as const }
      return valor
    }),
  }
}

const totales = Array(12).fill('-9.99')

describe('TablaResumenAnual', () => {
  it('al hacer clic en una celda, la convierte en un campo editable con el valor sin formatear', async () => {
    const wrapper = mount(TablaResumenAnual, {
      props: { titulo: 'Gastos', filas: [crearFila()], totales, mensajeVacio: 'Vacío' },
    })

    await wrapper.get('td button').trigger('click')

    const input = wrapper.get('td input')
    expect((input.element as HTMLInputElement).value).toBe('-9.99')
  })

  it('confirmar con Enter emite editar-celda con el nuevo importe', async () => {
    const wrapper = mount(TablaResumenAnual, {
      props: { titulo: 'Gastos', filas: [crearFila()], totales, mensajeVacio: 'Vacío' },
    })

    await wrapper.get('td button').trigger('click')
    const input = wrapper.get('td input')
    await input.setValue('-60.00')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('editar-celda')).toEqual([[1, 1, '-60.00']])
  })

  it('vaciar la celda y confirmar emite editar-celda con importe null (revertir)', async () => {
    const wrapper = mount(TablaResumenAnual, {
      props: { titulo: 'Gastos', filas: [crearFila()], totales, mensajeVacio: 'Vacío' },
    })

    await wrapper.get('td button').trigger('click')
    const input = wrapper.get('td input')
    await input.setValue('')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('editar-celda')).toEqual([[1, 1, null]])
  })

  it('Escape cancela la edición sin emitir editar-celda', async () => {
    const wrapper = mount(TablaResumenAnual, {
      props: { titulo: 'Gastos', filas: [crearFila()], totales, mensajeVacio: 'Vacío' },
    })

    await wrapper.get('td button').trigger('click')
    const input = wrapper.get('td input')
    await input.setValue('-60.00')
    await input.trigger('keydown.escape')

    expect(wrapper.emitted('editar-celda')).toBeUndefined()
    expect(wrapper.find('td input').exists()).toBe(false)
  })

  it('distingue visualmente celdas reales, previstas y ajustadas', () => {
    const wrapper = mount(TablaResumenAnual, {
      props: { titulo: 'Gastos', filas: [crearFila()], totales, mensajeVacio: 'Vacío' },
    })
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    // celdas[0] es el nombre; celdas[1..12] son los meses (mes 1 = previsto por defecto).
    expect(celdas[1]?.classes()).toContain('italic') // mes 1 = previsto
    expect(celdas[3]?.classes()).not.toContain('italic') // mes 3 = real
    expect(celdas[5]?.classes()).toContain('border-dashed') // mes 5 = ajustado
  })
})
