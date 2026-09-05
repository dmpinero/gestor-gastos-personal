import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BotonManualUsuario from '../BotonManualUsuario.vue'

const iniciarMock = vi.fn<() => void>()
vi.mock('@/composables/useTourGuiado', () => ({
  useTourGuiado: () => ({ iniciar: iniciarMock }),
}))

describe('BotonManualUsuario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('expone un aria-label descriptivo', () => {
    const wrapper = mount(BotonManualUsuario)

    expect(wrapper.get('button').attributes('aria-label')).toBe(
      'Abrir el manual de usuario interactivo',
    )
  })

  it('tiene el atributo data-tour para que el propio tour pueda señalarlo', () => {
    const wrapper = mount(BotonManualUsuario)

    expect(wrapper.get('button').attributes('data-tour')).toBe('boton-manual-usuario')
  })

  it('al pulsarlo, inicia el tour guiado', async () => {
    const wrapper = mount(BotonManualUsuario)

    await wrapper.get('button').trigger('click')

    expect(iniciarMock).toHaveBeenCalledTimes(1)
  })
})
