import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi, ErrorApi } from '@/api/cliente'
import type { ResumenImportacionDatosCompletos } from '@/api/tipos'
import { descargarBlob } from '@/lib/descargas'
import { formatearMarcaTemporalFichero } from '@/lib/formato'

export const useTiendaExportacion = defineStore('exportacion', () => {
  const error = ref<string | null>(null)
  const errorTraza = ref<string | null>(null)

  function _guardarError(motivo: unknown): void {
    error.value = (motivo as Error).message
    errorTraza.value = motivo instanceof ErrorApi ? (motivo.traza ?? null) : null
  }

  async function exportarDatosCompletos(): Promise<void> {
    error.value = null
    errorTraza.value = null
    try {
      const blob = await clienteApi.descargar('/exportacion/datos')
      descargarBlob(blob, `backup-gestor-gastos_${formatearMarcaTemporalFichero()}.xlsx`)
    } catch (motivo) {
      _guardarError(motivo)
    }
  }

  async function importarDatosCompletos(
    fichero: File,
  ): Promise<ResumenImportacionDatosCompletos | null> {
    error.value = null
    errorTraza.value = null
    try {
      return await clienteApi.subirArchivo<ResumenImportacionDatosCompletos>(
        '/exportacion/datos/importar',
        'fichero',
        fichero,
      )
    } catch (motivo) {
      _guardarError(motivo)
      return null
    }
  }

  return {
    error,
    errorTraza,
    exportarDatosCompletos,
    importarDatosCompletos,
  }
})
