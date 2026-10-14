import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { clienteApi } from '@/api/cliente'
import { useTourGuiado } from '@/composables/useTourGuiado'
import { formatearImporte } from '@/lib/formato'
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
      valores: Array.from({ length: 12 }, (_, indice) => ({
        mes: indice + 1,
        importe: '-500.00',
        origen: 'real',
      })),
      cancelado: false,
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

  it('el tour recorre importar, exportar, cargar acumulado, año, destacar mes, buscar, agrupar y las tablas', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaResumenAnual, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Alquiler'))

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-resumen-anual"]',
      '[data-tour="resumen-anual-asociar-conceptos"]',
      '[data-tour="resumen-anual-importar"]',
      '[data-tour="resumen-anual-exportar"]',
      '[data-tour="resumen-anual-cargar-acumulado"]',
      '[data-tour="resumen-anual-anadir-concepto"]',
      '[data-tour="resumen-anual-anio"]',
      '[data-tour="resumen-anual-destacar-mes"]',
      '[data-tour="resumen-anual-buscar"]',
      '[data-tour="resumen-anual-agrupar"]',
      '[data-tour="resumen-anual-tablas"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })
})

describe('VistaResumenAnual — oculta conceptos cancelados sin actividad real en el año', () => {
  it('no muestra un concepto cancelado cuyos 12 meses son solo previsto, y el total excluye su previsto', async () => {
    const resumen = {
      anio: 2020,
      filas_gastos: [
        {
          concepto_id: 1,
          categoria_id: 1,
          subcategoria_id: null,
          nombre: 'Openwebinars',
          periodicidad: 'mensual',
          valores: Array.from({ length: 12 }, (_, indice) => ({
            mes: indice + 1,
            importe: '-29.00',
            origen: 'previsto',
          })),
          cancelado: true,
        },
        {
          concepto_id: 2,
          categoria_id: 1,
          subcategoria_id: null,
          nombre: 'Alquiler',
          periodicidad: 'mensual',
          valores: Array.from({ length: 12 }, (_, indice) => ({
            mes: indice + 1,
            importe: '-500.00',
            origen: 'real',
          })),
          cancelado: false,
        },
      ],
      filas_ingresos: [],
      totales_gastos: Array(12).fill('-529.00'),
      totales_ingresos: Array(12).fill('0.00'),
    }
    vi.mocked(clienteApi.obtener).mockImplementation(((ruta: string) => {
      if (ruta.startsWith('/previsiones/resumen-anual')) return Promise.resolve(resumen)
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
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaResumenAnual, { global: { plugins: [pinia] } })

    await vi.waitFor(() => expect(contenedor.text()).toContain('Alquiler'))

    expect(contenedor.text()).not.toContain('Openwebinars')
    // Total mostrado: solo el real de Alquiler (-500,00), sin el previsto
    // de Openwebinars (-29,00) que ya no se ve.
    expect(contenedor.text()).toContain(formatearImporte('-500.00'))
    expect(contenedor.text()).not.toContain(formatearImporte('-529.00'))

    contenedor.unmount()
  })

  it('muestra un concepto no cancelado aunque no tenga actividad real este año (recién creado, o vigente a la espera de su próximo cargo)', async () => {
    const resumen = {
      anio: 2026,
      filas_gastos: [
        {
          concepto_id: 3,
          categoria_id: 1,
          subcategoria_id: null,
          nombre: 'Concepto recién creado',
          periodicidad: 'mensual',
          valores: Array.from({ length: 12 }, (_, indice) => ({
            mes: indice + 1,
            importe: '-20.00',
            origen: 'previsto',
          })),
          cancelado: false,
        },
      ],
      filas_ingresos: [],
      totales_gastos: Array(12).fill('-20.00'),
      totales_ingresos: Array(12).fill('0.00'),
    }
    vi.mocked(clienteApi.obtener).mockImplementation(((ruta: string) => {
      if (ruta.startsWith('/previsiones/resumen-anual')) return Promise.resolve(resumen)
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
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaResumenAnual, { global: { plugins: [pinia] } })

    await vi.waitFor(() => expect(contenedor.text()).toContain('Concepto recién creado'))

    contenedor.unmount()
  })
})
