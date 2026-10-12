import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi, ErrorApi } from '@/api/cliente'
import type { ProximoEvento } from '@/api/tipos'

export const useTiendaNotificaciones = defineStore('notificaciones', () => {
  const eventos = ref<ProximoEvento[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)
  const errorTraza = ref<string | null>(null)

  function _guardarError(motivo: unknown): void {
    error.value = (motivo as Error).message
    errorTraza.value = motivo instanceof ErrorApi ? (motivo.traza ?? null) : null
  }

  async function cargar(): Promise<void> {
    cargando.value = true
    error.value = null
    errorTraza.value = null
    try {
      eventos.value = await clienteApi.obtener<ProximoEvento[]>('/notificaciones')
    } catch (motivo) {
      _guardarError(motivo)
    } finally {
      cargando.value = false
    }
  }

  return {
    eventos,
    cargando,
    error,
    errorTraza,
    cargar,
  }
})
