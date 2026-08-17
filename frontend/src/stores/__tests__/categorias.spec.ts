import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import { useTiendaCategorias } from '@/stores/categorias'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
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
})
