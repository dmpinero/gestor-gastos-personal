import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { formatearImporte, formatearPeriodo } from '@/lib/formato'
import GraficoEvolucionGastos from '../GraficoEvolucionGastos.vue'

describe('GraficoEvolucionGastos', () => {
  it('no renderiza nada cuando no hay periodos', () => {
    const wrapper = mount(GraficoEvolucionGastos, { props: { items: [] } })

    expect(wrapper.text()).toBe('')
  })

  it('renderiza una barra por periodo con el importe y la etiqueta formateados', () => {
    const wrapper = mount(GraficoEvolucionGastos, {
      props: {
        items: [
          { periodo: '2026-01', total: 30 },
          { periodo: '2026-02', total: 10 },
        ],
      },
    })

    expect(wrapper.text()).toContain(formatearImporte(30))
    expect(wrapper.text()).toContain(formatearPeriodo('2026-01'))
    expect(wrapper.text()).toContain(formatearPeriodo('2026-02'))
  })

  it('la barra del periodo con mayor total ocupa el 100% de la altura', () => {
    const wrapper = mount(GraficoEvolucionGastos, {
      props: {
        items: [
          { periodo: '2026-01', total: 30 },
          { periodo: '2026-02', total: 15 },
        ],
      },
    })

    const barras = wrapper.findAll('.bg-destructive')
    expect(barras[0]?.attributes('style')).toContain('height: 100%')
    expect(barras[1]?.attributes('style')).toContain('height: 50%')
  })

  it('muestra barras por defecto y cambia a líneas al pulsar el botón correspondiente', async () => {
    const wrapper = mount(GraficoEvolucionGastos, {
      props: {
        items: [
          { periodo: '2026-01', total: 30 },
          { periodo: '2026-02', total: 15 },
        ],
      },
    })

    expect(wrapper.find('svg[role="img"]').exists()).toBe(false)
    expect(wrapper.findAll('.bg-destructive')).toHaveLength(2)

    await wrapper.get('[aria-label="Ver como líneas"]').trigger('click')

    expect(wrapper.find('svg[role="img"]').exists()).toBe(true)
    expect(wrapper.findAll('circle')).toHaveLength(2)
    expect(wrapper.findAll('.bg-destructive')).toHaveLength(0)
  })

  it('el modo área añade un polígono de relleno bajo la línea', async () => {
    const wrapper = mount(GraficoEvolucionGastos, {
      props: {
        items: [
          { periodo: '2026-01', total: 30 },
          { periodo: '2026-02', total: 15 },
        ],
      },
    })

    expect(wrapper.find('polygon').exists()).toBe(false)

    await wrapper.get('[aria-label="Ver como área"]').trigger('click')

    expect(wrapper.find('polygon').exists()).toBe(true)
    expect(wrapper.find('polyline').exists()).toBe(true)
  })
})
