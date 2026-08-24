import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import VistaInicio from '../VistaInicio.vue'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn<(...args: unknown[]) => unknown>(),
  },
}))

function mockearRutas(rutas: Record<string, unknown>): void {
  vi.mocked(clienteApi.obtener).mockImplementation(((ruta: string) => {
    for (const [prefijo, valor] of Object.entries(rutas)) {
      if (ruta.startsWith(prefijo)) return Promise.resolve(valor)
    }
    return Promise.resolve([])
  }) as typeof clienteApi.obtener)
}

describe('VistaInicio', () => {
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
