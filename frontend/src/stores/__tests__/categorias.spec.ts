import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import { useTiendaCategorias } from '@/stores/categorias'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn<(...args: unknown[]) => unknown>(),
    crear: vi.fn<(...args: unknown[]) => unknown>(),
    actualizar: vi.fn<(...args: unknown[]) => unknown>(),
    eliminar: vi.fn<(...args: unknown[]) => unknown>(),
  },
}))

const categoriaEjemplo = {
  categoria: { id: 1, nombre: 'Ocio y viajes' },
  subcategorias: [{ id: 1, nombre: 'Cafeterías y restaurantes', categoria_id: 1 }],
}

describe('useTiendaCategorias', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('carga las categorías con sus subcategorías', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([categoriaEjemplo])

    const tienda = useTiendaCategorias()
    await tienda.cargar()

    expect(tienda.categorias).toEqual([categoriaEjemplo])
  })

  it('elimina una categoría de la lista', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([categoriaEjemplo])
    vi.mocked(clienteApi.eliminar).mockResolvedValue(undefined)

    const tienda = useTiendaCategorias()
    await tienda.cargar()
    await tienda.eliminarCategoria(1)

    expect(tienda.categorias).toEqual([])
  })

  it('crearCategoria devuelve la categoría creada', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([categoriaEjemplo])
    vi.mocked(clienteApi.crear).mockResolvedValue({ id: 2, nombre: 'Salud' })

    const tienda = useTiendaCategorias()
    const categoria = await tienda.crearCategoria('Salud')

    expect(clienteApi.crear).toHaveBeenCalledWith('/categorias', { nombre: 'Salud' })
    expect(categoria).toEqual({ id: 2, nombre: 'Salud' })
  })

  it('recarga la lista tras crear una subcategoría', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([categoriaEjemplo])
    vi.mocked(clienteApi.crear).mockResolvedValue({ id: 2, nombre: 'Hoteles', categoria_id: 1 })

    const tienda = useTiendaCategorias()
    await tienda.crearSubcategoria(1, 'Hoteles')

    expect(clienteApi.crear).toHaveBeenCalledWith('/categorias/1/subcategorias', {
      nombre: 'Hoteles',
    })
    expect(tienda.categorias).toEqual([categoriaEjemplo])
  })

  it('crearSubcategoria devuelve la subcategoría creada', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([categoriaEjemplo])
    vi.mocked(clienteApi.crear).mockResolvedValue({ id: 2, nombre: 'Hoteles', categoria_id: 1 })

    const tienda = useTiendaCategorias()
    const subcategoria = await tienda.crearSubcategoria(1, 'Hoteles')

    expect(subcategoria).toEqual({ id: 2, nombre: 'Hoteles', categoria_id: 1 })
  })

  it('actualiza una subcategoría enviando el nombre y la categoría de destino', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([categoriaEjemplo])
    vi.mocked(clienteApi.actualizar).mockResolvedValue(undefined)

    const tienda = useTiendaCategorias()
    await tienda.actualizarSubcategoria(1, 1, 'Cafeterías', 2)

    expect(clienteApi.actualizar).toHaveBeenCalledWith('/categorias/1/subcategorias/1', {
      nombre: 'Cafeterías',
      categoria_id: 2,
    })
    expect(tienda.categorias).toEqual([categoriaEjemplo])
  })
})
