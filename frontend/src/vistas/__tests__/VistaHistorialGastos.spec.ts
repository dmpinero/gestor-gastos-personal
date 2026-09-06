import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { clienteApi } from '@/api/cliente'
import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaHistorialGastos from '../VistaHistorialGastos.vue'

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

const { rutaMock } = vi.hoisted(() => ({
  rutaMock: { name: 'historial', params: {} as Record<string, string> },
}))
vi.mock('vue-router', () => ({ useRoute: () => rutaMock }))

const CATEGORIAS = [
  {
    categoria: { id: 1, nombre: 'Alimentación' },
    subcategorias: [{ id: 10, nombre: 'Supermercado', categoria_id: 1 }],
  },
]
const MOVIMIENTOS = [
  {
    id: 100,
    cuenta_id: 1,
    categoria_id: 1,
    subcategoria_id: null,
    fecha_valor: '2020-01-15',
    descripcion: 'Compra semanal',
    comentario: null,
    importe: '-10.00',
    saldo: '990.00',
    origen: null,
  },
  {
    id: 101,
    cuenta_id: 1,
    categoria_id: 1,
    subcategoria_id: null,
    fecha_valor: '2020-02-15',
    descripcion: 'Devolución',
    comentario: null,
    importe: '5.00',
    saldo: '995.00',
    origen: null,
  },
]

function mockearRutas(): void {
  vi.mocked(clienteApi.obtener).mockImplementation(((ruta: string) => {
    if (ruta.startsWith('/categorias')) return Promise.resolve(CATEGORIAS)
    if (ruta.startsWith('/cuentas')) return Promise.resolve([])
    if (ruta.startsWith('/previsiones/movimientos-por-categoria'))
      return Promise.resolve(MOVIMIENTOS)
    return Promise.resolve([])
  }) as typeof clienteApi.obtener)
}

describe('VistaHistorialGastos — tour guiado', () => {
  beforeEach(() => {
    driverMock.mockClear()
    rutaMock.name = 'historial'
    rutaMock.params = {}
  })

  it('sin categoría elegida, el tour muestra un único paso sin elemento', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaHistorialGastos, { global: { plugins: [pinia] } })
    await contenedor.vm.$nextTick()

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    const pasosPagina = config?.steps?.filter(
      (paso) =>
        paso.element !== '[data-tour="nav-historial"]' &&
        paso.element !== '[data-tour="conmutador-tema"]' &&
        paso.element !== '[data-tour="boton-manual-usuario"]',
    )
    expect(pasosPagina).toHaveLength(1)
    expect(pasosPagina?.[0]?.element).toBeUndefined()
    contenedor.unmount()
  })

  it('con una categoría elegida, el tour recorre evolución, filtros, resultados y tabla', async () => {
    mockearRutas()
    rutaMock.name = 'historial-categoria'
    rutaMock.params = { id: '1' }
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaHistorialGastos, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Total gastado'))

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-historial"]',
      '[data-tour="historial-evolucion-gastos"]',
      '[data-tour="historial-evolucion-ingresos"]',
      '[data-tour="historial-filtros"]',
      '[data-tour="historial-resultados"]',
      '[data-tour="historial-tabla"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })
})
