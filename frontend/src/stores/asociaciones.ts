import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type {
  AsociacionConcepto,
  AsociacionDescripcion,
  DatosAsociacion,
  DatosAsociacionDescripcion,
} from '@/api/tipos'

export const useTiendaAsociaciones = defineStore('asociaciones', () => {
  const asociaciones = ref<AsociacionConcepto[]>([])
  const asociacionesDescripcion = ref<AsociacionDescripcion[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargar(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      const [conceptos, descripciones] = await Promise.all([
        clienteApi.obtener<AsociacionConcepto[]>('/previsiones/asociaciones'),
        clienteApi.obtener<AsociacionDescripcion[]>('/previsiones/asociaciones-descripcion'),
      ])
      asociaciones.value = conceptos
      asociacionesDescripcion.value = descripciones
    } catch (motivo) {
      error.value = (motivo as Error).message
    } finally {
      cargando.value = false
    }
  }

  async function crear(datos: DatosAsociacion): Promise<void> {
    await clienteApi.crear('/previsiones/asociaciones', datos)
    await cargar()
  }

  async function eliminar(id: number): Promise<void> {
    await clienteApi.eliminar(`/previsiones/asociaciones/${id}`)
    asociaciones.value = asociaciones.value.filter((a) => a.id !== id)
  }

  async function crearDescripcion(datos: DatosAsociacionDescripcion): Promise<void> {
    await clienteApi.crear('/previsiones/asociaciones-descripcion', datos)
    await cargar()
  }

  async function eliminarDescripcion(id: number): Promise<void> {
    await clienteApi.eliminar(`/previsiones/asociaciones-descripcion/${id}`)
    asociacionesDescripcion.value = asociacionesDescripcion.value.filter((a) => a.id !== id)
  }

  return {
    asociaciones,
    asociacionesDescripcion,
    cargando,
    error,
    cargar,
    crear,
    eliminar,
    crearDescripcion,
    eliminarDescripcion,
  }
})
