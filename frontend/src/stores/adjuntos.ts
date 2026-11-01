import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi, ErrorApi } from '@/api/cliente'
import type { Adjunto, ConteoAdjuntos } from '@/api/tipos'

export const useTiendaAdjuntos = defineStore('adjuntos', () => {
  const adjuntosPorMovimiento = ref<Record<number, Adjunto[]>>({})
  const conteos = ref<Record<number, number>>({})
  const cargando = ref(false)
  const error = ref<string | null>(null)
  const errorTraza = ref<string | null>(null)

  function _guardarError(motivo: unknown): void {
    error.value = (motivo as Error).message
    errorTraza.value = motivo instanceof ErrorApi ? (motivo.traza ?? null) : null
  }

  async function cargarConteos(): Promise<void> {
    error.value = null
    errorTraza.value = null
    try {
      const resultado = await clienteApi.obtener<ConteoAdjuntos[]>('/adjuntos/conteos')
      conteos.value = Object.fromEntries(resultado.map((c) => [c.movimiento_id, c.cantidad]))
    } catch (motivo) {
      _guardarError(motivo)
    }
  }

  async function cargarDeMovimiento(movimientoId: number): Promise<void> {
    cargando.value = true
    error.value = null
    errorTraza.value = null
    try {
      adjuntosPorMovimiento.value[movimientoId] = await clienteApi.obtener<Adjunto[]>(
        `/adjuntos/movimiento/${movimientoId}`,
      )
    } catch (motivo) {
      _guardarError(motivo)
    } finally {
      cargando.value = false
    }
  }

  async function subir(movimientoId: number, fichero: File): Promise<void> {
    error.value = null
    errorTraza.value = null
    try {
      await clienteApi.subirArchivo<Adjunto>(
        `/adjuntos/movimiento/${movimientoId}`,
        'fichero',
        fichero,
      )
      await Promise.all([cargarDeMovimiento(movimientoId), cargarConteos()])
    } catch (motivo) {
      _guardarError(motivo)
    }
  }

  async function eliminar(id: number, movimientoId: number): Promise<void> {
    error.value = null
    errorTraza.value = null
    try {
      await clienteApi.eliminar(`/adjuntos/${id}`)
      adjuntosPorMovimiento.value[movimientoId] = (
        adjuntosPorMovimiento.value[movimientoId] ?? []
      ).filter((a) => a.id !== id)
      await cargarConteos()
    } catch (motivo) {
      _guardarError(motivo)
    }
  }

  return {
    adjuntosPorMovimiento,
    conteos,
    cargando,
    error,
    errorTraza,
    cargarConteos,
    cargarDeMovimiento,
    subir,
    eliminar,
  }
})
