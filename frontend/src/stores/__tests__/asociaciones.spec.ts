import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import { useTiendaAsociaciones } from '@/stores/asociaciones'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn<(...args: unknown[]) => unknown>(),
    crear: vi.fn<(...args: unknown[]) => unknown>(),
    eliminar: vi.fn<(...args: unknown[]) => unknown>(),
  },
}))

const asociacionEjemplo = {
  id: 1,
  categoria_resumen_id: 10,
  subcategoria_resumen_id: null,
  categoria_movimiento_id: 20,
  subcategoria_movimiento_id: null,
}

describe('useTiendaAsociaciones', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('carga la lista de asociaciones', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([asociacionEjemplo])

    const tienda = useTiendaAsociaciones()
    await tienda.cargar()

    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones/asociaciones')
    expect(tienda.asociaciones).toEqual([asociacionEjemplo])
  })

  it('guarda el mensaje de error si cargar falla', async () => {
    vi.mocked(clienteApi.obtener).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaAsociaciones()
    await tienda.cargar()

    expect(tienda.error).toBe('fallo de red')
  })

  it('crea una asociación y recarga la lista', async () => {
    vi.mocked(clienteApi.crear).mockResolvedValue(asociacionEjemplo)
    vi.mocked(clienteApi.obtener).mockResolvedValue([asociacionEjemplo])

    const tienda = useTiendaAsociaciones()
    await tienda.crear({
      categoria_resumen_id: 10,
      subcategoria_resumen_id: null,
      categoria_movimiento_id: 20,
      subcategoria_movimiento_id: null,
    })

    expect(clienteApi.crear).toHaveBeenCalledWith('/previsiones/asociaciones', {
      categoria_resumen_id: 10,
      subcategoria_resumen_id: null,
      categoria_movimiento_id: 20,
      subcategoria_movimiento_id: null,
    })
    expect(tienda.asociaciones).toEqual([asociacionEjemplo])
  })

  it('crear propaga el error para que la vista lo muestre', async () => {
    vi.mocked(clienteApi.crear).mockRejectedValue(new Error('ya existe una asociación'))

    const tienda = useTiendaAsociaciones()

    await expect(
      tienda.crear({
        categoria_resumen_id: 10,
        categoria_movimiento_id: 20,
      }),
    ).rejects.toThrow('ya existe una asociación')
  })

  it('elimina una asociación de la lista en memoria sin recargar', async () => {
    vi.mocked(clienteApi.eliminar).mockResolvedValue(undefined)
    const tienda = useTiendaAsociaciones()
    tienda.asociaciones = [asociacionEjemplo, { ...asociacionEjemplo, id: 2 }]

    await tienda.eliminar(1)

    expect(clienteApi.eliminar).toHaveBeenCalledWith('/previsiones/asociaciones/1')
    expect(tienda.asociaciones).toEqual([{ ...asociacionEjemplo, id: 2 }])
  })
})
