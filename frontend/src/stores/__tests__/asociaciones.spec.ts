import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import { useTiendaAsociaciones } from '@/stores/asociaciones'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn<(...args: unknown[]) => unknown>(),
    crear: vi.fn<(...args: unknown[]) => unknown>(),
    actualizar: vi.fn<(...args: unknown[]) => unknown>(),
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

const asociacionDescripcionEjemplo = {
  id: 1,
  categoria_resumen_id: 10,
  subcategoria_resumen_id: null,
  descripcion: 'Recibo Ayuntamiento',
}

function mockearObtener(conceptos: unknown[] = [], descripciones: unknown[] = []): void {
  vi.mocked(clienteApi.obtener).mockImplementation((url: unknown) =>
    Promise.resolve(
      (url as string) === '/previsiones/asociaciones-descripcion' ? descripciones : conceptos,
    ),
  )
}

describe('useTiendaAsociaciones', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('carga la lista de asociaciones por categoría y por descripción', async () => {
    mockearObtener([asociacionEjemplo], [asociacionDescripcionEjemplo])

    const tienda = useTiendaAsociaciones()
    await tienda.cargar()

    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones/asociaciones')
    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones/asociaciones-descripcion')
    expect(tienda.asociaciones).toEqual([asociacionEjemplo])
    expect(tienda.asociacionesDescripcion).toEqual([asociacionDescripcionEjemplo])
  })

  it('guarda el mensaje de error si cargar falla', async () => {
    vi.mocked(clienteApi.obtener).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaAsociaciones()
    await tienda.cargar()

    expect(tienda.error).toBe('fallo de red')
  })

  it('crea una asociación por categoría y recarga la lista', async () => {
    vi.mocked(clienteApi.crear).mockResolvedValue(asociacionEjemplo)
    mockearObtener([asociacionEjemplo])

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

  it('actualiza una asociación por categoría y recarga la lista', async () => {
    const actualizada = { ...asociacionEjemplo, categoria_movimiento_id: 30 }
    vi.mocked(clienteApi.actualizar).mockResolvedValue(actualizada)
    mockearObtener([actualizada])

    const tienda = useTiendaAsociaciones()
    await tienda.actualizar(1, {
      categoria_resumen_id: 10,
      subcategoria_resumen_id: null,
      categoria_movimiento_id: 30,
      subcategoria_movimiento_id: null,
    })

    expect(clienteApi.actualizar).toHaveBeenCalledWith('/previsiones/asociaciones/1', {
      categoria_resumen_id: 10,
      subcategoria_resumen_id: null,
      categoria_movimiento_id: 30,
      subcategoria_movimiento_id: null,
    })
    expect(tienda.asociaciones).toEqual([actualizada])
  })

  it('actualizar propaga el error para que la vista lo muestre', async () => {
    vi.mocked(clienteApi.actualizar).mockRejectedValue(new Error('ya existe una asociación'))

    const tienda = useTiendaAsociaciones()

    await expect(
      tienda.actualizar(1, {
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

  it('crea una asociación por descripción y recarga la lista', async () => {
    vi.mocked(clienteApi.crear).mockResolvedValue(asociacionDescripcionEjemplo)
    mockearObtener([], [asociacionDescripcionEjemplo])

    const tienda = useTiendaAsociaciones()
    await tienda.crearDescripcion({
      categoria_resumen_id: 10,
      subcategoria_resumen_id: null,
      descripcion: 'Recibo Ayuntamiento',
    })

    expect(clienteApi.crear).toHaveBeenCalledWith('/previsiones/asociaciones-descripcion', {
      categoria_resumen_id: 10,
      subcategoria_resumen_id: null,
      descripcion: 'Recibo Ayuntamiento',
    })
    expect(tienda.asociacionesDescripcion).toEqual([asociacionDescripcionEjemplo])
  })

  it('crearDescripcion propaga el error para que la vista lo muestre', async () => {
    vi.mocked(clienteApi.crear).mockRejectedValue(new Error('ya existe una asociación'))

    const tienda = useTiendaAsociaciones()

    await expect(
      tienda.crearDescripcion({
        categoria_resumen_id: 10,
        descripcion: 'Recibo Ayuntamiento',
      }),
    ).rejects.toThrow('ya existe una asociación')
  })

  it('actualiza una asociación por descripción y recarga la lista', async () => {
    const actualizada = { ...asociacionDescripcionEjemplo, descripcion: 'Recibo Diputación' }
    vi.mocked(clienteApi.actualizar).mockResolvedValue(actualizada)
    mockearObtener([], [actualizada])

    const tienda = useTiendaAsociaciones()
    await tienda.actualizarDescripcion(1, {
      categoria_resumen_id: 10,
      subcategoria_resumen_id: null,
      descripcion: 'Recibo Diputación',
    })

    expect(clienteApi.actualizar).toHaveBeenCalledWith('/previsiones/asociaciones-descripcion/1', {
      categoria_resumen_id: 10,
      subcategoria_resumen_id: null,
      descripcion: 'Recibo Diputación',
    })
    expect(tienda.asociacionesDescripcion).toEqual([actualizada])
  })

  it('actualizarDescripcion propaga el error para que la vista lo muestre', async () => {
    vi.mocked(clienteApi.actualizar).mockRejectedValue(new Error('ya existe una asociación'))

    const tienda = useTiendaAsociaciones()

    await expect(
      tienda.actualizarDescripcion(1, {
        categoria_resumen_id: 10,
        descripcion: 'Recibo Ayuntamiento',
      }),
    ).rejects.toThrow('ya existe una asociación')
  })

  it('elimina una asociación por descripción de la lista en memoria sin recargar', async () => {
    vi.mocked(clienteApi.eliminar).mockResolvedValue(undefined)
    const tienda = useTiendaAsociaciones()
    tienda.asociacionesDescripcion = [
      asociacionDescripcionEjemplo,
      { ...asociacionDescripcionEjemplo, id: 2 },
    ]

    await tienda.eliminarDescripcion(1)

    expect(clienteApi.eliminar).toHaveBeenCalledWith('/previsiones/asociaciones-descripcion/1')
    expect(tienda.asociacionesDescripcion).toEqual([{ ...asociacionDescripcionEjemplo, id: 2 }])
  })
})
