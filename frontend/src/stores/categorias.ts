import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { CategoriaConSubcategorias, Subcategoria } from '@/api/tipos'

export const useTiendaCategorias = defineStore('categorias', () => {
  const categorias = ref<CategoriaConSubcategorias[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargar(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      categorias.value = await clienteApi.obtener<CategoriaConSubcategorias[]>('/categorias')
    } catch (motivo) {
      error.value = (motivo as Error).message
    } finally {
      cargando.value = false
    }
  }

  async function crearCategoria(nombre: string): Promise<void> {
    await clienteApi.crear('/categorias', { nombre })
    await cargar()
  }

  async function actualizarCategoria(id: number, nombre: string): Promise<void> {
    await clienteApi.actualizar(`/categorias/${id}`, { nombre })
    await cargar()
  }

  async function eliminarCategoria(id: number): Promise<void> {
    await clienteApi.eliminar(`/categorias/${id}`)
    categorias.value = categorias.value.filter((c) => c.categoria.id !== id)
  }

  async function crearSubcategoria(idCategoria: number, nombre: string): Promise<void> {
    await clienteApi.crear<Subcategoria>(`/categorias/${idCategoria}/subcategorias`, { nombre })
    await cargar()
  }

  async function actualizarSubcategoria(
    idCategoria: number,
    idSubcategoria: number,
    nombre: string,
  ): Promise<void> {
    await clienteApi.actualizar(`/categorias/${idCategoria}/subcategorias/${idSubcategoria}`, {
      nombre,
    })
    await cargar()
  }

  async function eliminarSubcategoria(idCategoria: number, idSubcategoria: number): Promise<void> {
    await clienteApi.eliminar(`/categorias/${idCategoria}/subcategorias/${idSubcategoria}`)
    await cargar()
  }

  return {
    categorias,
    cargando,
    error,
    cargar,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    crearSubcategoria,
    actualizarSubcategoria,
    eliminarSubcategoria,
  }
})
