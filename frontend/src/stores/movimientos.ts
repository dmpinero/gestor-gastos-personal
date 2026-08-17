import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { DatosMovimiento, Movimiento } from '@/api/tipos'

export const useTiendaMovimientos = defineStore('movimientos', () => {
  const movimientos = ref<Movimiento[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  // Evita que una respuesta de una cuenta anterior, si llega tarde, sobrescriba
  // con datos obsoletos el resultado de una petición de cuenta más reciente.
  let idSolicitudActual = 0

  async function cargar(cuentaId: number): Promise<void> {
    const idDeEstaSolicitud = ++idSolicitudActual
    cargando.value = true
    error.value = null
    try {
      const resultado = await clienteApi.obtener<Movimiento[]>(`/movimientos?cuenta_id=${cuentaId}`)
      if (idDeEstaSolicitud === idSolicitudActual) {
        movimientos.value = resultado
      }
    } catch (motivo) {
      if (idDeEstaSolicitud === idSolicitudActual) {
        error.value = (motivo as Error).message
      }
    } finally {
      if (idDeEstaSolicitud === idSolicitudActual) {
        cargando.value = false
      }
    }
  }

  async function crear(datos: DatosMovimiento): Promise<void> {
    const movimiento = await clienteApi.crear<Movimiento>('/movimientos', datos)
    movimientos.value.unshift(movimiento)
  }

  async function actualizar(id: number, datos: DatosMovimiento): Promise<void> {
    const movimiento = await clienteApi.actualizar<Movimiento>(`/movimientos/${id}`, datos)
    const indice = movimientos.value.findIndex((m) => m.id === id)
    if (indice !== -1) movimientos.value[indice] = movimiento
  }

  async function eliminar(id: number): Promise<void> {
    await clienteApi.eliminar(`/movimientos/${id}`)
    movimientos.value = movimientos.value.filter((m) => m.id !== id)
  }

  return { movimientos, cargando, error, cargar, crear, actualizar, eliminar }
})
