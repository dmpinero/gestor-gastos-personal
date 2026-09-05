import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { clienteApi } from '@/api/cliente'
import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaInicio from '../VistaInicio.vue'

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
vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'inicio' }) }))

function mockearRutas(rutas: Record<string, unknown>): void {
  vi.mocked(clienteApi.obtener).mockImplementation(((ruta: string) => {
    for (const [prefijo, valor] of Object.entries(rutas)) {
      if (ruta.startsWith(prefijo)) return Promise.resolve(valor)
    }
    return Promise.resolve([])
  }) as typeof clienteApi.obtener)
}

describe('VistaInicio', () => {
  beforeEach(() => {
    driverMock.mockClear()
  })

  it('el tour de la página recorre el saldo global, el saldo por cuenta y los bloques de categoría', async () => {
    mockearRutas({
      '/dashboard/resumen': {
        saldo_global: '2470.00',
        saldos_por_cuenta: [
          { cuenta_id: 1, numero_cuenta: 'ES00 1234', alias: null, saldo: '2470.00' },
        ],
        gastos_por_categoria: [{ categoria_id: 1, nombre: 'Alimentación', total: '-30.00' }],
        ingresos_por_categoria: [{ categoria_id: 2, nombre: 'Nómina', total: '1500.00' }],
      },
      '/cuentas': [{ id: 1, numero_cuenta: 'ES00 1234', alias: null }],
      '/categorias': [],
      '/movimientos': [],
    })
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaInicio, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Saldo global'))

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-dashboard"]',
      '[data-tour="dashboard-saldo-global"]',
      '[data-tour="dashboard-saldos-cuenta"]',
      '[data-tour="dashboard-gastos-categoria"]',
      '[data-tour="dashboard-ingresos-categoria"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })

  it('si el resumen aún no ha cargado, el tour muestra un único paso sin resaltar nada', () => {
    mockearRutas({ '/cuentas': [], '/categorias': [], '/movimientos': [] })
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaInicio, { global: { plugins: [pinia] } })

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-dashboard"]',
      undefined,
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    expect(config?.steps?.[1]?.popover?.title).toBe('Dashboard')
    contenedor.unmount()
  })

  it('muestra el saldo global, el saldo por cuenta y los totales por categoría', async () => {
    mockearRutas({
      '/dashboard/resumen': {
        saldo_global: '2470.00',
        saldos_por_cuenta: [
          { cuenta_id: 1, numero_cuenta: 'ES00 1234', alias: null, saldo: '2470.00' },
        ],
        gastos_por_categoria: [{ categoria_id: 1, nombre: 'Alimentación', total: '-30.00' }],
        ingresos_por_categoria: [{ categoria_id: 2, nombre: 'Nómina', total: '1500.00' }],
      },
      '/cuentas': [{ id: 1, numero_cuenta: 'ES00 1234', alias: null }],
      '/categorias': [],
      '/movimientos': [],
    })
    const pinia = createPinia()
    setActivePinia(pinia)

    const contenedor = mount(VistaInicio, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Saldo global'))

    expect(contenedor.text()).toContain('ES00 1234')
    expect(contenedor.text()).toContain('Alimentación')
    expect(contenedor.text()).toContain('Nómina')
  })

  it('muestra el mensaje de error si falla la carga del resumen', async () => {
    vi.mocked(clienteApi.obtener).mockRejectedValue(new Error('fallo de red'))
    const pinia = createPinia()
    setActivePinia(pinia)

    const contenedor = mount(VistaInicio, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('fallo de red'))
  })
})
