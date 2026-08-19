import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { ConceptoPrevisto, DatosConceptoPrevisto, ResumenAnual } from '@/api/tipos'

export const useTiendaPrevisiones = defineStore('previsiones', () => {
  const conceptos = ref<ConceptoPrevisto[]>([])
  const resumenAnual = ref<ResumenAnual | null>(null)
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargar(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      conceptos.value = await clienteApi.obtener<ConceptoPrevisto[]>('/previsiones')
    } catch (motivo) {
      error.value = (motivo as Error).message
    } finally {
      cargando.value = false
    }
  }

  async function crear(datos: DatosConceptoPrevisto): Promise<void> {
    await clienteApi.crear('/previsiones', datos)
    await cargar()
  }

  async function actualizar(id: number, datos: DatosConceptoPrevisto): Promise<void> {
    await clienteApi.actualizar(`/previsiones/${id}`, datos)
    await cargar()
  }

  async function eliminar(id: number): Promise<void> {
    await clienteApi.eliminar(`/previsiones/${id}`)
    conceptos.value = conceptos.value.filter((c) => c.id !== id)
  }

  async function cargarResumenAnual(anio: number): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      resumenAnual.value = await clienteApi.obtener<ResumenAnual>(
        `/previsiones/resumen-anual?anio=${anio}`,
      )
    } catch (motivo) {
      error.value = (motivo as Error).message
    } finally {
      cargando.value = false
    }
  }

  async function ajustarCelda(
    idConcepto: number,
    anio: number,
    mes: number,
    importe: string,
  ): Promise<void> {
    error.value = null
    try {
      await clienteApi.actualizar(`/previsiones/${idConcepto}/ajustes/${anio}/${mes}`, {
        importe,
      })
      await cargarResumenAnual(anio)
    } catch (motivo) {
      error.value = (motivo as Error).message
    }
  }

  async function eliminarAjuste(idConcepto: number, anio: number, mes: number): Promise<void> {
    error.value = null
    try {
      await clienteApi.eliminar(`/previsiones/${idConcepto}/ajustes/${anio}/${mes}`)
      await cargarResumenAnual(anio)
    } catch (motivo) {
      error.value = (motivo as Error).message
    }
  }

  return {
    conceptos,
    resumenAnual,
    cargando,
    error,
    cargar,
    crear,
    actualizar,
    eliminar,
    cargarResumenAnual,
    ajustarCelda,
    eliminarAjuste,
  }
})
