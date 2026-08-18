import { Hash } from '@lucide/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CabeceraOrdenable from '../CabeceraOrdenable.vue'

describe('CabeceraOrdenable', () => {
  it('muestra la etiqueta y emite "ordenar" al pulsar', async () => {
    const wrapper = mount(CabeceraOrdenable, {
      props: { icono: Hash, colorIcono: 'text-blue-500', activo: false, direccion: 'asc' },
      slots: { default: 'Número de cuenta' },
    })

    expect(wrapper.text()).toContain('Número de cuenta')

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('ordenar')).toHaveLength(1)
  })

  it('cuando no está activa muestra el icono de orden neutro', () => {
    const wrapper = mount(CabeceraOrdenable, {
      props: { icono: Hash, colorIcono: 'text-blue-500', activo: false, direccion: 'asc' },
    })

    expect(wrapper.findAll('svg')).toHaveLength(2)
  })

  it('cuando está activa en modo descendente sigue mostrando un único icono de orden', () => {
    const wrapper = mount(CabeceraOrdenable, {
      props: { icono: Hash, colorIcono: 'text-blue-500', activo: true, direccion: 'desc' },
    })

    expect(wrapper.findAll('svg')).toHaveLength(2)
  })
})
