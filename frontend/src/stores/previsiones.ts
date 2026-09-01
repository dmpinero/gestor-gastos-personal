import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi, ErrorApi } from '@/api/cliente'
import type {
  CargaAcumuladoReal,
  CargaAcumuladoRealTodos,
  ConceptoPrevisto,
  DatosConceptoPrevisto,
  Movimiento,
  ResumenAnual,
  ResumenImportacionConceptosPrevistos,
  ResumenImportacionResumenAnual,
} from '@/api/tipos'
import { descargarBlob } from '@/lib/descargas'
import { formatearMarcaTemporalFichero } from '@/lib/formato'

export const useTiendaPrevisiones = defineStore('previsiones', () => {
  const conceptos = ref<ConceptoPrevisto[]>([])
  const resumenAnual = ref<ResumenAnual | null>(null)
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
      conceptos.value = await clienteApi.obtener<ConceptoPrevisto[]>('/previsiones')
    } catch (motivo) {
      _guardarError(motivo)
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
    errorTraza.value = null
    try {
      resumenAnual.value = await clienteApi.obtener<ResumenAnual>(
        `/previsiones/resumen-anual?anio=${anio}`,
      )
    } catch (motivo) {
      _guardarError(motivo)
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
    errorTraza.value = null
    try {
      await clienteApi.actualizar(`/previsiones/${idConcepto}/ajustes/${anio}/${mes}`, {
        importe,
      })
      await cargarResumenAnual(anio)
    } catch (motivo) {
      _guardarError(motivo)
    }
  }

  async function eliminarAjuste(idConcepto: number, anio: number, mes: number): Promise<void> {
    error.value = null
    errorTraza.value = null
    try {
      await clienteApi.eliminar(`/previsiones/${idConcepto}/ajustes/${anio}/${mes}`)
      await cargarResumenAnual(anio)
    } catch (motivo) {
      _guardarError(motivo)
    }
  }

  async function cargarAcumuladoReal(idConcepto: number, anio: number): Promise<number> {
    error.value = null
    errorTraza.value = null
    try {
      const resultado = await clienteApi.crear<CargaAcumuladoReal>(
        `/previsiones/${idConcepto}/cargar-real/${anio}`,
        undefined,
      )
      await cargarResumenAnual(anio)
      return resultado.meses_actualizados
    } catch (motivo) {
      _guardarError(motivo)
      return 0
    }
  }

  async function cargarAcumuladoRealTodos(anio: number): Promise<CargaAcumuladoRealTodos | null> {
    cargando.value = true
    error.value = null
    errorTraza.value = null
    try {
      const resultado = await clienteApi.crear<CargaAcumuladoRealTodos>(
        `/previsiones/cargar-real?anio=${anio}`,
        undefined,
      )
      await cargarResumenAnual(anio)
      return resultado
    } catch (motivo) {
      _guardarError(motivo)
      return null
    } finally {
      cargando.value = false
    }
  }

  async function listarMovimientosDeConcepto(
    idConcepto: number,
    anio: number,
    mes: number,
  ): Promise<Movimiento[]> {
    return clienteApi.obtener<Movimiento[]>(
      `/previsiones/${idConcepto}/movimientos?anio=${anio}&mes=${mes}`,
    )
  }

  async function exportarResumenAnual(anioDesde: number, anioHasta: number): Promise<void> {
    error.value = null
    errorTraza.value = null
    try {
      const blob = await clienteApi.descargar(
        `/previsiones/resumen-anual/exportar?anio_desde=${anioDesde}&anio_hasta=${anioHasta}`,
      )
      const rangoAnios = anioDesde === anioHasta ? `${anioDesde}` : `${anioDesde}-${anioHasta}`
      const nombreFichero = `resumen-anual-${rangoAnios}_${formatearMarcaTemporalFichero()}.xlsx`
      descargarBlob(blob, nombreFichero)
    } catch (motivo) {
      _guardarError(motivo)
    }
  }

  // El fichero ya lleva el año de cada fila en su propia columna "Año", así
  // que la importación no necesita que se le indique un año. Tras importar,
  // quien llama decide qué año recargar en pantalla (cargarResumenAnual).
  async function importarResumenAnualExcel(
    fichero: File,
  ): Promise<ResumenImportacionResumenAnual | null> {
    error.value = null
    errorTraza.value = null
    try {
      return await clienteApi.subirArchivo<ResumenImportacionResumenAnual>(
        '/previsiones/resumen-anual/importar',
        'fichero',
        fichero,
      )
    } catch (motivo) {
      _guardarError(motivo)
      return null
    }
  }

  async function importarConceptosPrevistosExcel(
    fichero: File,
  ): Promise<ResumenImportacionConceptosPrevistos | null> {
    error.value = null
    errorTraza.value = null
    try {
      return await clienteApi.subirArchivo<ResumenImportacionConceptosPrevistos>(
        '/previsiones/importar',
        'fichero',
        fichero,
      )
    } catch (motivo) {
      _guardarError(motivo)
      return null
    }
  }

  return {
    conceptos,
    resumenAnual,
    cargando,
    error,
    errorTraza,
    cargar,
    crear,
    actualizar,
    eliminar,
    cargarResumenAnual,
    ajustarCelda,
    eliminarAjuste,
    cargarAcumuladoReal,
    cargarAcumuladoRealTodos,
    listarMovimientosDeConcepto,
    exportarResumenAnual,
    importarResumenAnualExcel,
    importarConceptosPrevistosExcel,
  }
})
