import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import { descargarBlob } from '@/lib/descargas'
import { useTiendaExportacion } from '@/stores/exportacion'

vi.mock('@/api/cliente', async (importarOriginal) => {
  const original = await importarOriginal<typeof import('@/api/cliente')>()
  return {
    ErrorApi: original.ErrorApi,
    clienteApi: {
      descargar: vi.fn<(...args: unknown[]) => unknown>(),
      subirArchivo: vi.fn<(...args: unknown[]) => unknown>(),
    },
  }
})

vi.mock('@/lib/descargas', () => ({
  descargarBlob: vi.fn<(blob: Blob, nombreFichero: string) => void>(),
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useTiendaExportacion', () => {
  it('exporta los datos completos y dispara la descarga del fichero', async () => {
    const blob = new Blob(['contenido'])
    vi.mocked(clienteApi.descargar).mockResolvedValue(blob)

    const tienda = useTiendaExportacion()
    await tienda.exportarDatosCompletos()

    expect(clienteApi.descargar).toHaveBeenCalledWith('/exportacion/datos')
    expect(descargarBlob).toHaveBeenCalledWith(
      blob,
      expect.stringMatching(/^backup-gestor-gastos_\d{8}_\d{6}\.xlsx$/),
    )
    expect(tienda.error).toBeNull()
  })

  it('guarda el mensaje de error si la exportación falla', async () => {
    vi.mocked(clienteApi.descargar).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaExportacion()
    await tienda.exportarDatosCompletos()

    expect(tienda.error).toBe('fallo de red')
    expect(descargarBlob).not.toHaveBeenCalled()
  })

  it('importa un backup y devuelve el resumen de la restauración', async () => {
    const resumen = {
      cuentas_importadas: 1,
      categorias_importadas: 2,
      subcategorias_importadas: 3,
      movimientos_importados: 4,
      conceptos_previstos_importados: 5,
      ajustes_importados: 6,
    }
    vi.mocked(clienteApi.subirArchivo).mockResolvedValue(resumen)
    const fichero = new File(['contenido'], 'backup-gestor-gastos.xlsx')

    const tienda = useTiendaExportacion()
    const devuelto = await tienda.importarDatosCompletos(fichero)

    expect(clienteApi.subirArchivo).toHaveBeenCalledWith(
      '/exportacion/datos/importar',
      'fichero',
      fichero,
    )
    expect(devuelto).toEqual(resumen)
    expect(tienda.error).toBeNull()
  })

  it('guarda el mensaje de error si importar el backup falla y devuelve null', async () => {
    vi.mocked(clienteApi.subirArchivo).mockRejectedValue(new Error('formato no soportado'))
    const fichero = new File(['contenido'], 'backup.xlsx')

    const tienda = useTiendaExportacion()
    const devuelto = await tienda.importarDatosCompletos(fichero)

    expect(tienda.error).toBe('formato no soportado')
    expect(devuelto).toBeNull()
  })
})
