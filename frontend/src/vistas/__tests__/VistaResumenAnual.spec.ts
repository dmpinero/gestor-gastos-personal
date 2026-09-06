import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { clienteApi } from '@/api/cliente'
import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaResumenAnual from '../VistaResumenAnual.vue'

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
vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'resumen-anual' }) }))

const RESUMEN_ANUAL = {
  anio: 2026,
  filas_gastos: [
    {
      concepto_id: 1,
      categoria_id: 1,
      subcategoria_id: null,
      nombre: 'Alquiler',
      periodicidad: 'mensual',
      valores: [],
    },
  ],
  filas_ingresos: [],
  totales_gastos: [],
  totales_ingresos: [],
}

function mockearRutas(): void {
  vi.mocked(clienteApi.obtener).mockImplementation(((ruta: string) => {
    if (ruta.startsWith('/previsiones/resumen-anual')) return Promise.resolve(RESUMEN_ANUAL)
    if (ruta.startsWith('/previsiones')) return Promise.resolve([])
    if (ruta.startsWith('/categorias')) return Promise.resolve([])
    if (ruta.startsWith('/dashboard/resumen')) {
      return Promise.resolve({
        saldo_global: '0.00',
        saldos_por_cuenta: [],
        gastos_por_categoria: [],
        ingresos_por_categoria: [],
      })
    }
    return Promise.resolve([])
  }) as typeof clienteApi.obtener)
}

describe('VistaResumenAnual — tour guiado', () => {
  beforeEach(() => {
    driverMock.mockClear()
  })

  it('el tour recorre importar, exportar, cargar acumulado, año, buscar, agrupar y las tablas', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaResumenAnual, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Alquiler'))

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-resumen-anual"]',
      '[data-tour="resumen-anual-importar"]',
      '[data-tour="resumen-anual-exportar"]',
      '[data-tour="resumen-anual-cargar-acumulado"]',
      '[data-tour="resumen-anual-anadir-concepto"]',
      '[data-tour="resumen-anual-anio"]',
      '[data-tour="resumen-anual-buscar"]',
      '[data-tour="resumen-anual-agrupar"]',
      '[data-tour="resumen-anual-tablas"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })
})
