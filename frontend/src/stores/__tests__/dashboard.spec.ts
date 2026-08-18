import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import { useTiendaDashboard } from '@/stores/dashboard'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn<(...args: unknown[]) => unknown>(),
  },
}))

const resumenEjemplo = {
  saldo_global: '2480.00',
  saldos_por_cuenta: [{ cuenta_id: 1, numero_cuenta: 'ES00 1234', alias: null, saldo: '2480.00' }],
  gastos_por_categoria: [{ categoria_id: 1, nombre: 'Alimentación', total: '-20.00' }],
  ingresos_por_categoria: [{ categoria_id: 2, nombre: 'Nómina', total: '1500.00' }],
}

describe('useTiendaDashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('carga el resumen desde la API', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue(resumenEjemplo)

    const tienda = useTiendaDashboard()
    await tienda.cargar()

    expect(tienda.resumen).toEqual(resumenEjemplo)
    expect(tienda.cargando).toBe(false)
  })

  it('guarda el mensaje de error si falla la carga', async () => {
    vi.mocked(clienteApi.obtener).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaDashboard()
    await tienda.cargar()

    expect(tienda.error).toBe('fallo de red')
    expect(tienda.resumen).toBeNull()
  })
})
