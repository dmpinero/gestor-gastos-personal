import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi, ErrorApi } from '@/api/cliente'
import { descargarBlob } from '@/lib/descargas'
import { useTiendaPrevisiones } from '@/stores/previsiones'

vi.mock('@/api/cliente', async (importarOriginal) => {
  const original = await importarOriginal<typeof import('@/api/cliente')>()
  return {
    ErrorApi: original.ErrorApi,
    clienteApi: {
      obtener: vi.fn<(...args: unknown[]) => unknown>(),
      crear: vi.fn<(...args: unknown[]) => unknown>(),
      actualizar: vi.fn<(...args: unknown[]) => unknown>(),
      eliminar: vi.fn<(...args: unknown[]) => unknown>(),
      subirArchivo: vi.fn<(...args: unknown[]) => unknown>(),
      descargar: vi.fn<(...args: unknown[]) => unknown>(),
    },
  }
})

vi.mock('@/lib/descargas', () => ({
  descargarBlob: vi.fn<(blob: Blob, nombreFichero: string) => void>(),
}))

const conceptoEjemplo = {
  id: 1,
  categoria_id: 1,
  subcategoria_id: null,
  periodicidad: 'mensual' as const,
  mes_inicio: null,
  importe_previsto: '-50.00',
}

const resumenEjemplo = {
  anio: 2026,
  filas_gastos: [],
  filas_ingresos: [],
  totales_gastos: Array(12).fill('0.00'),
  totales_ingresos: Array(12).fill('0.00'),
}

describe('useTiendaPrevisiones', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('carga los conceptos previstos', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([conceptoEjemplo])

    const tienda = useTiendaPrevisiones()
    await tienda.cargar()

    expect(tienda.conceptos).toEqual([conceptoEjemplo])
    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones')
  })

  it('recarga la lista tras crear un concepto', async () => {
    vi.mocked(clienteApi.crear).mockResolvedValue(conceptoEjemplo)
    vi.mocked(clienteApi.obtener).mockResolvedValue([conceptoEjemplo])

    const tienda = useTiendaPrevisiones()
    await tienda.crear({
      categoria_id: 1,
      subcategoria_id: null,
      periodicidad: 'mensual',
      mes_inicio: null,
      importe_previsto: '-50.00',
    })

    expect(clienteApi.crear).toHaveBeenCalledWith('/previsiones', {
      categoria_id: 1,
      subcategoria_id: null,
      periodicidad: 'mensual',
      mes_inicio: null,
      importe_previsto: '-50.00',
    })
    expect(tienda.conceptos).toEqual([conceptoEjemplo])
  })

  it('recarga la lista tras actualizar un concepto', async () => {
    vi.mocked(clienteApi.actualizar).mockResolvedValue(undefined)
    vi.mocked(clienteApi.obtener).mockResolvedValue([conceptoEjemplo])

    const tienda = useTiendaPrevisiones()
    await tienda.actualizar(1, {
      categoria_id: 1,
      subcategoria_id: null,
      periodicidad: 'anual',
      mes_inicio: 3,
      importe_previsto: '-120.00',
    })

    expect(clienteApi.actualizar).toHaveBeenCalledWith('/previsiones/1', {
      categoria_id: 1,
      subcategoria_id: null,
      periodicidad: 'anual',
      mes_inicio: 3,
      importe_previsto: '-120.00',
    })
    expect(tienda.conceptos).toEqual([conceptoEjemplo])
  })

  it('elimina un concepto de la lista', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue([conceptoEjemplo])
    vi.mocked(clienteApi.eliminar).mockResolvedValue(undefined)

    const tienda = useTiendaPrevisiones()
    await tienda.cargar()
    await tienda.eliminar(1)

    expect(clienteApi.eliminar).toHaveBeenCalledWith('/previsiones/1')
    expect(tienda.conceptos).toEqual([])
  })

  it('carga el resumen anual de un año dado', async () => {
    vi.mocked(clienteApi.obtener).mockResolvedValue(resumenEjemplo)

    const tienda = useTiendaPrevisiones()
    await tienda.cargarResumenAnual(2026)

    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones/resumen-anual?anio=2026')
    expect(tienda.resumenAnual).toEqual(resumenEjemplo)
  })

  it('guarda el mensaje de error si la carga del resumen falla', async () => {
    vi.mocked(clienteApi.obtener).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaPrevisiones()
    await tienda.cargarResumenAnual(2026)

    expect(tienda.error).toBe('fallo de red')
    expect(tienda.resumenAnual).toBeNull()
  })

  it('ajusta una celda y recarga el resumen del año', async () => {
    vi.mocked(clienteApi.actualizar).mockResolvedValue(undefined)
    vi.mocked(clienteApi.obtener).mockResolvedValue(resumenEjemplo)

    const tienda = useTiendaPrevisiones()
    await tienda.ajustarCelda(1, 2026, 5, '-30.00')

    expect(clienteApi.actualizar).toHaveBeenCalledWith('/previsiones/1/ajustes/2026/5', {
      importe: '-30.00',
    })
    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones/resumen-anual?anio=2026')
    expect(tienda.resumenAnual).toEqual(resumenEjemplo)
  })

  it('guarda el mensaje de error si ajustar una celda falla', async () => {
    vi.mocked(clienteApi.actualizar).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaPrevisiones()
    await tienda.ajustarCelda(1, 2026, 5, '-30.00')

    expect(tienda.error).toBe('fallo de red')
  })

  it('elimina un ajuste y recarga el resumen del año', async () => {
    vi.mocked(clienteApi.eliminar).mockResolvedValue(undefined)
    vi.mocked(clienteApi.obtener).mockResolvedValue(resumenEjemplo)

    const tienda = useTiendaPrevisiones()
    await tienda.eliminarAjuste(1, 2026, 5)

    expect(clienteApi.eliminar).toHaveBeenCalledWith('/previsiones/1/ajustes/2026/5')
    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones/resumen-anual?anio=2026')
    expect(tienda.resumenAnual).toEqual(resumenEjemplo)
  })

  it('carga el acumulado real, recarga el resumen y devuelve los meses actualizados', async () => {
    vi.mocked(clienteApi.crear).mockResolvedValue({ meses_actualizados: 3 })
    vi.mocked(clienteApi.obtener).mockResolvedValue(resumenEjemplo)

    const tienda = useTiendaPrevisiones()
    const devuelto = await tienda.cargarAcumuladoReal(1, 2026)

    expect(clienteApi.crear).toHaveBeenCalledWith('/previsiones/1/cargar-real/2026', undefined)
    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones/resumen-anual?anio=2026')
    expect(tienda.resumenAnual).toEqual(resumenEjemplo)
    expect(devuelto).toBe(3)
  })

  it('guarda el mensaje de error si cargar el acumulado real falla y devuelve 0', async () => {
    vi.mocked(clienteApi.crear).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaPrevisiones()
    const devuelto = await tienda.cargarAcumuladoReal(1, 2026)

    expect(tienda.error).toBe('fallo de red')
    expect(devuelto).toBe(0)
  })

  it('lista los movimientos de un concepto en un mes concreto', async () => {
    const movimientos = [
      {
        id: 1,
        cuenta_id: 1,
        categoria_id: 1,
        subcategoria_id: null,
        fecha_valor: '2026-03-15',
        descripcion: 'Amazon Prime',
        comentario: null,
        importe: '-4.99',
        saldo: '100.00',
      },
    ]
    vi.mocked(clienteApi.obtener).mockResolvedValue(movimientos)

    const tienda = useTiendaPrevisiones()
    const devuelto = await tienda.listarMovimientosDeConcepto(1, 2026, 3)

    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones/1/movimientos?anio=2026&mes=3')
    expect(devuelto).toEqual(movimientos)
  })

  it('exporta un solo año y dispara la descarga del fichero con su nombre', async () => {
    const blob = new Blob(['contenido'])
    vi.mocked(clienteApi.descargar).mockResolvedValue(blob)

    const tienda = useTiendaPrevisiones()
    await tienda.exportarResumenAnual(2026, 2026)

    expect(clienteApi.descargar).toHaveBeenCalledWith(
      '/previsiones/resumen-anual/exportar?anio_desde=2026&anio_hasta=2026',
    )
    expect(descargarBlob).toHaveBeenCalledWith(
      blob,
      expect.stringMatching(/^resumen-anual-2026_\d{8}_\d{6}\.xlsx$/),
    )
  })

  it('exporta un rango de años y dispara la descarga con un nombre de fichero que indica el rango', async () => {
    const blob = new Blob(['contenido'])
    vi.mocked(clienteApi.descargar).mockResolvedValue(blob)

    const tienda = useTiendaPrevisiones()
    await tienda.exportarResumenAnual(2025, 2027)

    expect(clienteApi.descargar).toHaveBeenCalledWith(
      '/previsiones/resumen-anual/exportar?anio_desde=2025&anio_hasta=2027',
    )
    expect(descargarBlob).toHaveBeenCalledWith(
      blob,
      expect.stringMatching(/^resumen-anual-2025-2027_\d{8}_\d{6}\.xlsx$/),
    )
  })

  it('guarda el mensaje de error si exportar el resumen falla', async () => {
    vi.mocked(clienteApi.descargar).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaPrevisiones()
    await tienda.exportarResumenAnual(2026, 2026)

    expect(tienda.error).toBe('fallo de red')
    expect(descargarBlob).not.toHaveBeenCalled()
  })

  it('importa un Excel del resumen anual sin recargar nada del store', async () => {
    const resultado = { celdas_actualizadas: 2, celdas_eliminadas: 1, conceptos_no_encontrados: 0 }
    vi.mocked(clienteApi.subirArchivo).mockResolvedValue(resultado)
    const fichero = new File(['contenido'], 'resumen-anual-2026.xlsx')

    const tienda = useTiendaPrevisiones()
    const devuelto = await tienda.importarResumenAnualExcel(fichero)

    expect(clienteApi.subirArchivo).toHaveBeenCalledWith(
      '/previsiones/resumen-anual/importar',
      'fichero',
      fichero,
    )
    expect(clienteApi.obtener).not.toHaveBeenCalled()
    expect(devuelto).toEqual(resultado)
  })

  it('guarda el mensaje de error si importar el Excel falla y devuelve null', async () => {
    vi.mocked(clienteApi.subirArchivo).mockRejectedValue(new Error('formato no soportado'))
    const fichero = new File(['contenido'], 'resumen-anual-2026.xlsx')

    const tienda = useTiendaPrevisiones()
    const devuelto = await tienda.importarResumenAnualExcel(fichero)

    expect(tienda.error).toBe('formato no soportado')
    expect(devuelto).toBeNull()
  })

  it('importa un Excel de conceptos previstos sin recargar nada del store', async () => {
    const resultado = {
      conceptos_creados: 2,
      conceptos_omitidos_por_duplicado: 1,
      categorias_creadas: ['Suscripciones'],
      subcategorias_creadas: ['Streaming'],
    }
    vi.mocked(clienteApi.subirArchivo).mockResolvedValue(resultado)
    const fichero = new File(['contenido'], 'conceptos.xlsx')

    const tienda = useTiendaPrevisiones()
    const devuelto = await tienda.importarConceptosPrevistosExcel(fichero)

    expect(clienteApi.subirArchivo).toHaveBeenCalledWith(
      '/previsiones/importar',
      'fichero',
      fichero,
    )
    expect(clienteApi.obtener).not.toHaveBeenCalled()
    expect(devuelto).toEqual(resultado)
  })

  it('guarda el mensaje de error si importar conceptos previstos falla y devuelve null', async () => {
    vi.mocked(clienteApi.subirArchivo).mockRejectedValue(new Error('periodicidad no reconocida'))
    const fichero = new File(['contenido'], 'conceptos.xlsx')

    const tienda = useTiendaPrevisiones()
    const devuelto = await tienda.importarConceptosPrevistosExcel(fichero)

    expect(tienda.error).toBe('periodicidad no reconocida')
    expect(devuelto).toBeNull()
  })

  it('guarda la traza si importar el resumen anual falla con un ErrorApi con traza', async () => {
    vi.mocked(clienteApi.subirArchivo).mockRejectedValue(
      new ErrorApi(500, 'boom inesperado', 'Traceback...'),
    )
    const fichero = new File(['contenido'], 'resumen-anual-2026.xlsx')

    const tienda = useTiendaPrevisiones()
    await tienda.importarResumenAnualExcel(fichero)

    expect(tienda.error).toBe('boom inesperado')
    expect(tienda.errorTraza).toBe('Traceback...')
  })

  it('guarda la traza si importar conceptos previstos falla con un ErrorApi con traza', async () => {
    vi.mocked(clienteApi.subirArchivo).mockRejectedValue(
      new ErrorApi(500, 'boom inesperado', 'Traceback...'),
    )
    const fichero = new File(['contenido'], 'conceptos.xlsx')

    const tienda = useTiendaPrevisiones()
    await tienda.importarConceptosPrevistosExcel(fichero)

    expect(tienda.error).toBe('boom inesperado')
    expect(tienda.errorTraza).toBe('Traceback...')
  })

  it('deja errorTraza a null cuando el error no es un ErrorApi con traza', async () => {
    vi.mocked(clienteApi.subirArchivo).mockRejectedValue(new Error('fallo de red'))
    const fichero = new File(['contenido'], 'conceptos.xlsx')

    const tienda = useTiendaPrevisiones()
    await tienda.importarConceptosPrevistosExcel(fichero)

    expect(tienda.errorTraza).toBeNull()
  })
})
