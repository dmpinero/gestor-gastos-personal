import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { clienteApi } from '@/api/cliente'
import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaCategorias from '../VistaCategorias.vue'

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
vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'gestion-categorias' }) }))

const CATEGORIAS = [
  {
    categoria: { id: 1, nombre: 'Alimentación' },
    subcategorias: [{ id: 10, nombre: 'Supermercado', categoria_id: 1 }],
  },
]

function mockearRutas(): void {
  vi.mocked(clienteApi.obtener).mockImplementation(((ruta: string) => {
    if (ruta.startsWith('/categorias')) return Promise.resolve(CATEGORIAS)
    if (ruta.startsWith('/cuentas')) return Promise.resolve([])
    return Promise.resolve([])
  }) as typeof clienteApi.obtener)
}

describe('VistaCategorias — tour guiado', () => {
  beforeEach(() => {
    driverMock.mockClear()
  })

  it('el tour recorre crear, filtros, selección y la tarjeta de categoría', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaCategorias, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Alimentación'))

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-gestion"]',
      '[data-tour="categorias-crear"]',
      '[data-tour="categorias-filtros"]',
      '[data-tour="categorias-seleccion"]',
      '[data-tour="categorias-barra-seleccion"]',
      '[data-tour="categorias-tarjeta"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })

  it('al iniciar el tour, marca la primera categoría; al cerrarlo, restaura la selección previa', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaCategorias, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Alimentación'))
    expect(contenedor.text()).not.toContain('seleccionados')

    useTourGuiado().iniciar()
    await contenedor.vm.$nextTick()
    expect(contenedor.text()).toContain('1 seleccionados')

    const config = driverMock.mock.calls[0]?.[0]
    config?.onDestroyStarted?.(
      undefined,
      {} as Parameters<NonNullable<Config['onDestroyStarted']>>[1],
      {} as Parameters<NonNullable<Config['onDestroyStarted']>>[2],
    )
    await contenedor.vm.$nextTick()
    expect(contenedor.text()).not.toContain('seleccionados')
    contenedor.unmount()
  })
})
