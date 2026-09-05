import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { clienteApi } from '@/api/cliente'
import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaCuentas from '../VistaCuentas.vue'

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
vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'gestion-cuentas' }) }))

const CUENTAS = [
  {
    id: 1,
    numero_cuenta: 'ES00 1111',
    alias: 'Uno',
    entidad_bancaria: null,
    moneda: null,
    titular: null,
  },
  {
    id: 2,
    numero_cuenta: 'ES00 2222',
    alias: 'Dos',
    entidad_bancaria: null,
    moneda: null,
    titular: null,
  },
]

function mockearRutas(): void {
  vi.mocked(clienteApi.obtener).mockImplementation(((ruta: string) => {
    if (ruta.startsWith('/cuentas')) return Promise.resolve(CUENTAS)
    if (ruta.startsWith('/categorias')) return Promise.resolve([])
    return Promise.resolve([])
  }) as typeof clienteApi.obtener)
}

describe('VistaCuentas — tour guiado', () => {
  beforeEach(() => {
    driverMock.mockClear()
  })

  it('el tour recorre crear, filtros, selección, exportar, tabla y paginación', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaCuentas, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('ES00 1111'))

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-gestion"]',
      '[data-tour="cuentas-crear"]',
      '[data-tour="cuentas-filtros"]',
      '[data-tour="cuentas-seleccion"]',
      '[data-tour="cuentas-barra-seleccion"]',
      '[data-tour="cuentas-exportar"]',
      '[data-tour="cuentas-tabla"]',
      '[data-tour="cuentas-paginacion"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })

  it('al iniciar el tour, marca la primera cuenta; al cerrarlo, restaura la selección previa', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaCuentas, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('ES00 1111'))
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
