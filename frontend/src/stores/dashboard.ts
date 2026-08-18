import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { ResumenDashboard } from '@/api/tipos'

export const useTiendaDashboard = defineStore('dashboard', () => {
  const resumen = ref<ResumenDashboard | null>(null)
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargar(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      resumen.value = await clienteApi.obtener<ResumenDashboard>('/dashboard/resumen')
    } catch (motivo) {
      error.value = (motivo as Error).message
    } finally {
      cargando.value = false
    }
  }

  return { resumen, cargando, error, cargar }
})
