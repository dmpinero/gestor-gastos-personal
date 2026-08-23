import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { DatosMovimiento, Movimiento } from '@/api/tipos'

export const useTiendaMovimientos = defineStore('movimientos', () => {
  const movimientos = ref<Movimiento[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  // Evita que una respuesta de una solicitud anterior, si llega tarde, sobrescriba
  // con datos obsoletos el resultado de una solicitud más reciente (de cuenta,
  // categoría o subcategoría: comparten el mismo `movimientos` de destino).
  let idSolicitudActual = 0

  async function cargarConFiltro(ruta: string): Promise<void> {
    const idDeEstaSolicitud = ++idSolicitudActual
    cargando.value = true
    error.value = null
    try {
      const resultado = await clienteApi.obtener<Movimiento[]>(ruta)
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

  async function cargar(cuentaId: number): Promise<void> {
    await cargarConFiltro(`/movimientos?cuenta_id=${cuentaId}`)
  }

  // El backend exige exactamente un cuenta_id por petición (no admite una
  // lista), así que la multi-selección de cuentas se resuelve en el
  // cliente: una petición por cuenta, fusionando los resultados.
  async function cargarVarias(cuentaIds: number[]): Promise<void> {
    const idDeEstaSolicitud = ++idSolicitudActual
    cargando.value = true
    error.value = null
    try {
      const resultados = await Promise.all(
        cuentaIds.map((id) => clienteApi.obtener<Movimiento[]>(`/movimientos?cuenta_id=${id}`)),
      )
      if (idDeEstaSolicitud === idSolicitudActual) {
        movimientos.value = resultados.flat()
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

  async function cargarPorCategoria(categoriaId: number): Promise<void> {
    await cargarConFiltro(`/movimientos?categoria_id=${categoriaId}&solo_gastos=true`)
  }

  async function cargarPorSubcategoria(subcategoriaId: number): Promise<void> {
    await cargarConFiltro(`/movimientos?subcategoria_id=${subcategoriaId}&solo_gastos=true`)
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

  function limpiar(): void {
    ++idSolicitudActual
    movimientos.value = []
    error.value = null
  }

  return {
    movimientos,
    cargando,
    error,
    cargar,
    cargarVarias,
    cargarPorCategoria,
    cargarPorSubcategoria,
    crear,
    actualizar,
    eliminar,
    limpiar,
  }
})
