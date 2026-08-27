import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BotonCopiarImporte from '../BotonCopiarImporte.vue'

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn<(texto: string) => Promise<void>>().mockResolvedValue(undefined) },
    configurable: true,
  })
})

describe('BotonCopiarImporte', () => {
  it('al pulsar, copia el importe recibido en crudo al portapapeles', async () => {
    const wrapper = mount(BotonCopiarImporte, { props: { valor: '-4.99' } })

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('-4.99')
  })

  it('tras copiar, muestra brevemente el icono de confirmación', async () => {
    vi.useFakeTimers()
    const wrapper = mount(BotonCopiarImporte, { props: { valor: '10.00' } })

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('svg.text-success').exists()).toBe(true)

    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('svg.text-success').exists()).toBe(false)

    vi.useRealTimers()
  })

  it('expone un aria-label con el importe a copiar', () => {
    const wrapper = mount(BotonCopiarImporte, { props: { valor: '-4.99' } })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Copiar importe -4.99')
  })
})
