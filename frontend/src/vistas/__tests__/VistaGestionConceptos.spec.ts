import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { clienteApi } from '@/api/cliente'
import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaGestionConceptos from '../VistaGestionConceptos.vue'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn<(...args: unknown[]) => unknown>(),
  },
}))

const { driverMock } = vi.hoisted(() => {
  const driverMock = vi.fn<(config: Config) => { drive: () => void; destroy: () => void }>(() => ({
    drive: vi.fn<() => void>(),
    destroy: vi.fn<() => void>(),
  }))
  return { driverMock }
})
vi.mock('driver.js', () => ({ driver: driverMock }))
vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'gestion-conceptos' }) }))

function mockearRutas(): void {
  vi.mocked(clienteApi.obtener).mockResolvedValue([])
}

describe('VistaGestionConceptos — tour guiado', () => {
  beforeEach(() => {
    driverMock.mockClear()
  })

  it('el tour recorre los formularios de asociación y las tablas', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaGestionConceptos, { global: { plugins: [pinia] } })
    await contenedor.vm.$nextTick()

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-gestion"]',
      '[data-tour="conceptos-form-categoria"]',
      '[data-tour="conceptos-form-descripcion"]',
      '[data-tour="conceptos-boton-crear"]',
      '[data-tour="conceptos-sin-asociar"]',
      '[data-tour="conceptos-tabla-asociaciones"]',
      '[data-tour="conceptos-tabla-asociaciones-descripcion"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })
})
