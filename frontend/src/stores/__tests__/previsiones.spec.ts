import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clienteApi } from '@/api/cliente'
import { descargarBlob } from '@/lib/descargas'
import { useTiendaPrevisiones } from '@/stores/previsiones'

vi.mock('@/api/cliente', () => ({
  clienteApi: {
    obtener: vi.fn<(...args: unknown[]) => unknown>(),
    crear: vi.fn<(...args: unknown[]) => unknown>(),
    actualizar: vi.fn<(...args: unknown[]) => unknown>(),
    eliminar: vi.fn<(...args: unknown[]) => unknown>(),
    subirArchivo: vi.fn<(...args: unknown[]) => unknown>(),
    descargar: vi.fn<(...args: unknown[]) => unknown>(),
  },
}))

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

  it('exporta el resumen anual y dispara la descarga del fichero', async () => {
    const blob = new Blob(['contenido'])
    vi.mocked(clienteApi.descargar).mockResolvedValue(blob)

    const tienda = useTiendaPrevisiones()
    await tienda.exportarResumenAnual(2026)

    expect(clienteApi.descargar).toHaveBeenCalledWith(
      '/previsiones/resumen-anual/exportar?anio=2026',
    )
    expect(descargarBlob).toHaveBeenCalledWith(blob, 'resumen-anual-2026.xlsx')
  })

  it('guarda el mensaje de error si exportar el resumen falla', async () => {
    vi.mocked(clienteApi.descargar).mockRejectedValue(new Error('fallo de red'))

    const tienda = useTiendaPrevisiones()
    await tienda.exportarResumenAnual(2026)

    expect(tienda.error).toBe('fallo de red')
    expect(descargarBlob).not.toHaveBeenCalled()
  })

  it('importa un Excel del resumen anual y recarga el resumen del año', async () => {
    const resultado = { celdas_actualizadas: 2, celdas_eliminadas: 1, conceptos_no_encontrados: 0 }
    vi.mocked(clienteApi.subirArchivo).mockResolvedValue(resultado)
    vi.mocked(clienteApi.obtener).mockResolvedValue(resumenEjemplo)
    const fichero = new File(['contenido'], 'resumen-anual-2026.xlsx')

    const tienda = useTiendaPrevisiones()
    const devuelto = await tienda.importarResumenAnualExcel(2026, fichero)

    expect(clienteApi.subirArchivo).toHaveBeenCalledWith(
      '/previsiones/resumen-anual/importar?anio=2026',
      'fichero',
      fichero,
    )
    expect(clienteApi.obtener).toHaveBeenCalledWith('/previsiones/resumen-anual?anio=2026')
    expect(devuelto).toEqual(resultado)
  })

  it('guarda el mensaje de error si importar el Excel falla y devuelve null', async () => {
    vi.mocked(clienteApi.subirArchivo).mockRejectedValue(new Error('formato no soportado'))
    const fichero = new File(['contenido'], 'resumen-anual-2026.xlsx')

    const tienda = useTiendaPrevisiones()
    const devuelto = await tienda.importarResumenAnualExcel(2026, fichero)

    expect(tienda.error).toBe('formato no soportado')
    expect(devuelto).toBeNull()
  })
})
