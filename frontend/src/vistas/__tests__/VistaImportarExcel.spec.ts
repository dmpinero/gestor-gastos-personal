import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { clienteApi } from '@/api/cliente'
import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaImportarExcel from '../VistaImportarExcel.vue'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn<(...args: unknown[]) => unknown>(),
  },
  ErrorApi: class ErrorApi extends Error {},
}))

const { driverMock } = vi.hoisted(() => {
  const driverMock = vi.fn<(config: Config) => { drive: () => void; destroy: () => void }>(() => ({
    drive: vi.fn<() => void>(),
    destroy: vi.fn<() => void>(),
  }))
  return { driverMock }
})
vi.mock('driver.js', () => ({ driver: driverMock }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ name: 'importar' }),
  useRouter: () => ({ push: vi.fn<(ruta: string) => void>() }),
}))

describe('VistaImportarExcel — tour guiado', () => {
  beforeEach(() => {
    driverMock.mockClear()
    vi.mocked(clienteApi.obtener).mockResolvedValue([])
  })

  it('el tour recorre el bloque de importar movimientos y el de conceptos previstos', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaImportarExcel, { global: { plugins: [pinia] } })
    await contenedor.vm.$nextTick()

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-importar"]',
      '[data-tour="importar-movimientos"]',
      '[data-tour="importar-conceptos"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })
})
