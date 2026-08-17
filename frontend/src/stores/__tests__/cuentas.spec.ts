import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import { useTiendaCuentas } from '@/stores/cuentas'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
}))

const cuentaEjemplo = {
  id: 1,
  numero_cuenta: 'ES00 1234',
  alias: null,
  entidad_bancaria: null,
  moneda: null,
  titular: null,
}

describe('useTiendaCuentas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('carga las cuentas desde la API', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([cuentaEjemplo])

    const tienda = useTiendaCuentas()
    await tienda.cargar()

    expect(tienda.cuentas).toEqual([cuentaEjemplo])
    expect(tienda.cargando).toBe(false)
  })

  it('guarda el mensaje de error si falla la carga', async () => {
    vi.mocked(clienteApi.obtener).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaCuentas()
    await tienda.cargar()

    expect(tienda.error).toBe('fallo de red')
  })

  it('añade la cuenta creada a la lista', async () => {
    vi.mocked(clienteApi.crear).mockResolvedValue(cuentaEjemplo)

    const tienda = useTiendaCuentas()
    await tienda.crear({ numero_cuenta: 'ES00 1234' })

    expect(tienda.cuentas).toEqual([cuentaEjemplo])
  })

  it('elimina la cuenta de la lista', async () => {
    vi.mocked(clienteApi.crear).mockResolvedValue(cuentaEjemplo)
    vi.mocked(clienteApi.eliminar).mockResolvedValue(undefined)

    const tienda = useTiendaCuentas()
    await tienda.crear({ numero_cuenta: 'ES00 1234' })
    await tienda.eliminar(1)

    expect(tienda.cuentas).toEqual([])
  })
})
