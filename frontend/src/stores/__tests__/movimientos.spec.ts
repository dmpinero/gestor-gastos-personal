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

  it('carga los movimientos de una categoría usando el endpoint que también tiene en cuenta las asociaciones', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([movimientoEjemplo])

    const tienda = useTiendaMovimientos()
    await tienda.cargarPorCategoria(5)

    expect(clienteApi.obtener).toHaveBeenCalledWith(
      '/previsiones/movimientos-por-categoria?categoria_id=5',
    )
    expect(tienda.movimientos).toEqual([movimientoEjemplo])
  })

  it('carga los movimientos de una subcategoría incluyendo la categoría en la petición', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([movimientoEjemplo])

    const tienda = useTiendaMovimientos()
    await tienda.cargarPorSubcategoria(5, 42)

    expect(clienteApi.obtener).toHaveBeenCalledWith(
      '/previsiones/movimientos-por-categoria?categoria_id=5&subcategoria_id=42',
    )
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

  it('carga y fusiona los movimientos de varias cuentas', async () => {
    const movimientoCuenta2 = { ...movimientoEjemplo, id: 2, cuenta_id: 2 }
    vi.mocked(clienteApi.obtener)
      .mockResolvedValueOnce([movimientoEjemplo])
      .mockResolvedValueOnce([movimientoCuenta2])

    const tienda = useTiendaMovimientos()
    await tienda.cargarVarias([1, 2])

    expect(clienteApi.obtener).toHaveBeenCalledWith('/movimientos?cuenta_id=1')
    expect(clienteApi.obtener).toHaveBeenCalledWith('/movimientos?cuenta_id=2')
    expect(tienda.movimientos).toEqual([movimientoEjemplo, movimientoCuenta2])
  })

  it('con una lista de cuentas vacía no hace peticiones y deja los movimientos vacíos', async () => {
    const tienda = useTiendaMovimientos()
    await tienda.cargarVarias([])

    expect(clienteApi.obtener).not.toHaveBeenCalled()
    expect(tienda.movimientos).toEqual([])
  })

  it('ignora una respuesta obsoleta de cargarVarias que llega tras una selección más reciente', async () => {
    let resolverPrimeraLlamada: (valor: (typeof movimientoEjemplo)[]) => void
    const primeraLlamada = new Promise<(typeof movimientoEjemplo)[]>((resolver) => {
      resolverPrimeraLlamada = resolver
    })
    const movimientoCuenta2 = { ...movimientoEjemplo, id: 2, cuenta_id: 2 }
    vi.mocked(clienteApi.obtener)
      .mockReturnValueOnce(primeraLlamada)
      .mockResolvedValueOnce([movimientoCuenta2])

    const tienda = useTiendaMovimientos()
    const primeraSeleccion = tienda.cargarVarias([1]) // se queda pendiente
    await tienda.cargarVarias([2]) // se resuelve antes

    resolverPrimeraLlamada!([movimientoEjemplo]) // respuesta tardía de la selección anterior
    await primeraSeleccion

    expect(tienda.movimientos).toEqual([movimientoCuenta2])
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
