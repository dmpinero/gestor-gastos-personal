import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { AsociacionConcepto, DatosAsociacion } from '@/api/tipos'

export const useTiendaAsociaciones = defineStore('asociaciones', () => {
  const asociaciones = ref<AsociacionConcepto[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargar(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      asociaciones.value = await clienteApi.obtener<AsociacionConcepto[]>(
        '/previsiones/asociaciones',
      )
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

  return {
    asociaciones,
    cargando,
    error,
    cargar,
    crear,
    eliminar,
  }
})
