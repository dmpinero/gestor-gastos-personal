import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BotonManualUsuario from '../BotonManualUsuario.vue'

const iniciarMock = vi.fn<() => void>()
vi.mock('@/composables/useTourGuiado', () => ({
  useTourGuiado: () => ({ iniciar: iniciarMock }),
}))

// reka-ui usa ResizeObserver internamente para posicionar el contenido del
// Popover; jsdom no lo implementa.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub)

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>())
})

afterEach(() => {
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

describe('BotonManualUsuario', () => {
  it('expone un aria-label descriptivo', () => {
    const wrapper = mount(BotonManualUsuario)

    expect(wrapper.get('button').attributes('aria-label')).toBe(
      'Ayuda: manual de usuario interactivo e historial de cambios',
    )
  })

  it('tiene el atributo data-tour para que el propio tour pueda señalarlo', () => {
    const wrapper = mount(BotonManualUsuario)

    expect(wrapper.get('button').attributes('data-tour')).toBe('boton-manual-usuario')
  })

  it('al pulsarlo, muestra las opciones de manual de usuario e historial de cambios', async () => {
    const wrapper = mount(BotonManualUsuario, { attachTo: document.body })

    await wrapper.get('button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('Manual de usuario')
    expect(document.body.textContent).toContain('Historial de cambios')
    wrapper.unmount()
  })

  it('al elegir "Manual de usuario", inicia el tour guiado', async () => {
    const wrapper = mount(BotonManualUsuario, { attachTo: document.body })

    await wrapper.get('button').trigger('click')
    await wrapper.vm.$nextTick()
    const botonManual = Array.from(document.body.querySelectorAll('button')).find((boton) =>
      boton.textContent?.includes('Manual de usuario'),
    )
    botonManual?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(iniciarMock).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
