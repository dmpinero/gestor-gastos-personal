import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type {
  CategoriaConSubcategorias,
  DependenciasCategoria,
  DependenciasSubcategoria,
  Subcategoria,
} from '@/api/tipos'

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

  async function eliminarCategoria(id: number, cascada = false): Promise<void> {
    await clienteApi.eliminar(`/categorias/${id}${cascada ? '?cascada=true' : ''}`)
    categorias.value = categorias.value.filter((c) => c.categoria.id !== id)
  }

  async function obtenerDependenciasCategoria(id: number): Promise<DependenciasCategoria> {
    return clienteApi.obtener<DependenciasCategoria>(`/categorias/${id}/dependencias`)
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

  async function eliminarSubcategoria(
    idCategoria: number,
    idSubcategoria: number,
    cascada = false,
  ): Promise<void> {
    await clienteApi.eliminar(
      `/categorias/${idCategoria}/subcategorias/${idSubcategoria}${cascada ? '?cascada=true' : ''}`,
    )
    await cargar()
  }

  async function obtenerDependenciasSubcategoria(
    idCategoria: number,
    idSubcategoria: number,
  ): Promise<DependenciasSubcategoria> {
    return clienteApi.obtener<DependenciasSubcategoria>(
      `/categorias/${idCategoria}/subcategorias/${idSubcategoria}/dependencias`,
    )
  }

  return {
    categorias,
    cargando,
    error,
    cargar,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    obtenerDependenciasCategoria,
    crearSubcategoria,
    actualizarSubcategoria,
    eliminarSubcategoria,
    obtenerDependenciasSubcategoria,
  }
})
