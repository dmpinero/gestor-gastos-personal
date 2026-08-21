import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FiltroRangoNumero from '../FiltroRangoNumero.vue'

describe('FiltroRangoNumero', () => {
  it('renderiza las etiquetas mínimo y máximo a partir de la prop label', () => {
    const wrapper = mount(FiltroRangoNumero, {
      props: { label: 'Importe', idBase: 'filtro-importe', min: '', max: '' },
    })

    expect(wrapper.text()).toContain('Importe mínimo')
    expect(wrapper.text()).toContain('Importe máximo')
  })

  it('emite update:min al escribir en el campo mínimo', async () => {
    const wrapper = mount(FiltroRangoNumero, {
      props: { label: 'Importe', idBase: 'filtro-importe', min: '', max: '' },
    })

    await wrapper.get('#filtro-importe-min').setValue('10')

    expect(wrapper.emitted('update:min')).toEqual([['10']])
  })

  it('emite update:max al escribir en el campo máximo', async () => {
    const wrapper = mount(FiltroRangoNumero, {
      props: { label: 'Saldo', idBase: 'filtro-saldo', min: '', max: '' },
    })

    await wrapper.get('#filtro-saldo-max').setValue('500')

    expect(wrapper.emitted('update:max')).toEqual([['500']])
  })
})
