import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type {
  ConceptoPrevisto,
  DatosConceptoPrevisto,
  ResumenAnual,
  ResumenImportacionConceptosPrevistos,
  ResumenImportacionResumenAnual,
} from '@/api/tipos'
import { descargarBlob } from '@/lib/descargas'

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

  async function exportarResumenAnual(anio: number): Promise<void> {
    error.value = null
    try {
      const blob = await clienteApi.descargar(`/previsiones/resumen-anual/exportar?anio=${anio}`)
      descargarBlob(blob, `resumen-anual-${anio}.xlsx`)
    } catch (motivo) {
      error.value = (motivo as Error).message
    }
  }

  async function importarResumenAnualExcel(
    anio: number,
    fichero: File,
  ): Promise<ResumenImportacionResumenAnual | null> {
    error.value = null
    try {
      const resultado = await clienteApi.subirArchivo<ResumenImportacionResumenAnual>(
        `/previsiones/resumen-anual/importar?anio=${anio}`,
        'fichero',
        fichero,
      )
      await cargarResumenAnual(anio)
      return resultado
    } catch (motivo) {
      error.value = (motivo as Error).message
      return null
    }
  }

  async function importarConceptosPrevistosExcel(
    fichero: File,
  ): Promise<ResumenImportacionConceptosPrevistos | null> {
    error.value = null
    try {
      return await clienteApi.subirArchivo<ResumenImportacionConceptosPrevistos>(
        '/previsiones/importar',
        'fichero',
        fichero,
      )
    } catch (motivo) {
      error.value = (motivo as Error).message
      return null
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
    exportarResumenAnual,
    importarResumenAnualExcel,
    importarConceptosPrevistosExcel,
  }
})
