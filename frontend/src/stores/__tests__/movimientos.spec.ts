import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import { useTiendaMovimientos } from '@/stores/movimientos'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn<(...args: unknown[]) => unknown>(),
    crear: vi.fn<(...args: unknown[]) => unknown>(),
    actualizar: vi.fn<(...args: unknown[]) => unknown>(),
    eliminar: vi.fn<(...args: unknown[]) => unknown>(),
  },
}))

const movimientoEjemplo = {
  id: 1,
  cuenta_id: 1,
  categoria_id: 1,
  subcategoria_id: null,
  fecha_valor: '2026-01-01',
  descripcion: 'Compra',
  comentario: null,
  importe: '-10.00',
  saldo: '100.00',
}

describe('useTiendaMovimientos', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('carga los movimientos de una cuenta', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([movimientoEjemplo])

    const tienda = useTiendaMovimientos()
    await tienda.cargar(1)

    expect(clienteApi.obtener).toHaveBeenCalledWith('/movimientos?cuenta_id=1')
    expect(tienda.movimientos).toEqual([movimientoEjemplo])
  })

  it('añade el movimiento nuevo al principio de la lista', async () => {
    vi.mocked(clienteApi.crear).mockResolvedValue(movimientoEjemplo)

    const tienda = useTiendaMovimientos()
    await tienda.crear({
      cuenta_id: 1,
      categoria_id: 1,
      fecha_valor: '2026-01-01',
      descripcion: 'Compra',
      importe: '-10.00',
      saldo: '100.00',
    })

    expect(tienda.movimientos).toEqual([movimientoEjemplo])
  })

  it('ignora una respuesta obsoleta que llega después de una petición más reciente', async () => {
    let resolverPrimeraLlamada: (valor: (typeof movimientoEjemplo)[]) => void
    const primeraLlamada = new Promise<(typeof movimientoEjemplo)[]>((resolver) => {
      resolverPrimeraLlamada = resolver
    })
    vi.mocked(clienteApi.obtener)
      .mockReturnValueOnce(primeraLlamada)
      .mockResolvedValueOnce([movimientoEjemplo])

    const tienda = useTiendaMovimientos()
    const cargaCuenta1 = tienda.cargar(1) // se queda pendiente
    await tienda.cargar(2) // se resuelve antes: cuenta_id=2

    resolverPrimeraLlamada!([]) // la respuesta tardía de la cuenta 1 llega ahora
    await cargaCuenta1

    expect(tienda.movimientos).toEqual([movimientoEjemplo])
  })

  it('elimina un movimiento de la lista', async () => {
    vi.mocked(clienteApi.crear).mockResolvedValue(movimientoEjemplo)
    vi.mocked(clienteApi.eliminar).mockResolvedValue(undefined)

    const tienda = useTiendaMovimientos()
    await tienda.crear({
      cuenta_id: 1,
      categoria_id: 1,
      fecha_valor: '2026-01-01',
      descripcion: 'Compra',
      importe: '-10.00',
      saldo: '100.00',
    })
    await tienda.eliminar(1)

    expect(tienda.movimientos).toEqual([])
  })
})
