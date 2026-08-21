import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DialogoDetalleError from '../DialogoDetalleError.vue'

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn<(texto: string) => Promise<void>>().mockResolvedValue(undefined) },
    configurable: true,
  })
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('DialogoDetalleError', () => {
  it('no muestra el botón "Más detalle" si no hay traza', () => {
    const wrapper = mount(DialogoDetalleError, { props: { mensaje: 'fallo' } })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('abre la modal con la traza completa y permite copiarla', async () => {
    const wrapper = mount(DialogoDetalleError, {
      props: { mensaje: 'fallo inesperado', traza: 'Traceback (most recent call last):\n...' },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    expect(document.body.textContent).toContain('Traceback (most recent call last):')

    const botonCopiar = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
    ).find((boton) => boton.textContent?.trim() === 'Copiar')
    botonCopiar?.click()
    await flushPromises()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Traceback (most recent call last):\n...',
    )
    expect(document.body.textContent).toContain('Copiado')

    wrapper.unmount()
  })
})
