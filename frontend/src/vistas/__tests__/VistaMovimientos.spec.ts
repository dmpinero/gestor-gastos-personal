import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { clienteApi } from '@/api/cliente'
import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaMovimientos from '../VistaMovimientos.vue'

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
vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'movimientos', query: {} }) }))

const CUENTAS = [
  {
    id: 1,
    numero_cuenta: 'ES00 1111',
    alias: 'Cuenta 1',
    entidad_bancaria: null,
    moneda: null,
    titular: null,
  },
]
const MOVIMIENTOS = [
  {
    id: 100,
    cuenta_id: 1,
    categoria_id: 1,
    subcategoria_id: null,
    fecha_valor: '2020-01-15',
    descripcion: 'Movimiento de prueba',
    comentario: null,
    importe: '-10.00',
    saldo: '990.00',
    origen: null,
  },
]

const CATEGORIAS = [{ categoria: { id: 1, nombre: 'Alimentación' }, subcategorias: [] }]

function mockearRutas(): void {
  vi.mocked(clienteApi.obtener).mockImplementation(((ruta: string) => {
    if (ruta.startsWith('/cuentas')) return Promise.resolve(CUENTAS)
    if (ruta.startsWith('/categorias')) return Promise.resolve(CATEGORIAS)
    if (ruta.startsWith('/movimientos')) return Promise.resolve(MOVIMIENTOS)
    return Promise.resolve([])
  }) as typeof clienteApi.obtener)
}

describe('VistaMovimientos — tour guiado', () => {
  beforeEach(() => {
    driverMock.mockClear()
  })

  it('el tour recorre las funcionalidades de Movimientos en orden', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaMovimientos, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Movimiento de prueba'))

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-movimientos"]',
      '[data-tour="movimientos-crear"]',
      '[data-tour="movimientos-saldo"]',
      '[data-tour="movimientos-evolucion-gastos"]',
      '[data-tour="movimientos-evolucion-ingresos"]',
      '[data-tour="movimientos-comparativo"]',
      '[data-tour="movimientos-top-categorias"]',
      '[data-tour="movimientos-filtro-cuenta"]',
      '[data-tour="movimientos-filtro-fecha"]',
      '[data-tour="movimientos-mes-atajos"]',
      '[data-tour="movimientos-filtro-categoria"]',
      '[data-tour="movimientos-filtro-importe"]',
      '[data-tour="movimientos-filtro-origen-pdf"]',
      '[data-tour="movimientos-limpiar-filtros"]',
      '[data-tour="movimientos-agrupar"]',
      '[data-tour="movimientos-exportar"]',
      '[data-tour="movimientos-seleccion"]',
      '[data-tour="movimientos-barra-seleccion"]',
      '[data-tour="movimientos-tabla"]',
      '[data-tour="movimientos-paginacion"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })

  it('fuerza el filtro de fechas al mes actual para revelar "Mes anterior/siguiente", y lo restaura al cerrar', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaMovimientos, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Movimiento de prueba'), {
      timeout: 3000,
    })
    expect((contenedor.find('#filtro-fecha-desde').element as HTMLInputElement).value).toBe('')
    expect(contenedor.findAll('button').some((b) => b.text() === 'Mes anterior')).toBe(false)

    useTourGuiado().iniciar()
    await contenedor.vm.$nextTick()
    expect((contenedor.find('#filtro-fecha-desde').element as HTMLInputElement).value).not.toBe('')
    expect(contenedor.findAll('button').some((b) => b.text() === 'Mes anterior')).toBe(true)

    const config = driverMock.mock.calls[0]?.[0]
    config?.onDestroyStarted?.(
      undefined,
      {} as Parameters<NonNullable<Config['onDestroyStarted']>>[1],
      {} as Parameters<NonNullable<Config['onDestroyStarted']>>[2],
    )
    await contenedor.vm.$nextTick()
    expect((contenedor.find('#filtro-fecha-desde').element as HTMLInputElement).value).toBe('')
    expect(contenedor.findAll('button').some((b) => b.text() === 'Mes anterior')).toBe(false)
    contenedor.unmount()
  })

  it('marca el primer movimiento visible para revelar la barra de acciones, y restaura la selección previa al cerrar', async () => {
    mockearRutas()
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaMovimientos, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(contenedor.text()).toContain('Movimiento de prueba'), {
      timeout: 3000,
    })
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
