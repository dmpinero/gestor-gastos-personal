import { describe, expect, it, vi } from 'vitest'
import { descargarBlob } from '../descargas'
import { exportarTablaExcel, exportarTablaPDF } from '../exportarTabla'

vi.mock('../descargas', () => ({ descargarBlob: vi.fn<(blob: Blob, nombre: string) => void>() }))

const guardarPdf = vi.fn<(nombre: string) => void>()
const textoPdf = vi.fn<(texto: string, x: number, y: number) => void>()

vi.mock('jspdf', () => ({
  jsPDF: vi.fn<() => object>().mockImplementation(function () {
    return { setFontSize: vi.fn<(tamano: number) => void>(), text: textoPdf, save: guardarPdf }
  }),
}))
vi.mock('jspdf-autotable', () => ({ default: vi.fn<(...args: unknown[]) => void>() }))

describe('exportarTablaExcel', () => {
  it('genera un libro de Excel y lo descarga con el nombre de fichero indicado', async () => {
    await exportarTablaExcel('Servicios.xlsx', ['Fecha', 'Importe'], [['05/01/2026', '-45,00 €']])

    expect(descargarBlob).toHaveBeenCalledOnce()
    const llamada = vi.mocked(descargarBlob).mock.calls[0]
    const [blob, nombreFichero] = llamada as [Blob, string]
    expect(nombreFichero).toBe('Servicios.xlsx')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  })
})

describe('exportarTablaPDF', () => {
  it('escribe el título y guarda el PDF con el nombre de fichero indicado', async () => {
    await exportarTablaPDF(
      'Servicios.pdf',
      'Servicios',
      ['Fecha', 'Importe'],
      [['05/01/2026', '-45,00 €']],
    )

    expect(textoPdf).toHaveBeenCalledWith('Servicios', 14, 15)
    expect(guardarPdf).toHaveBeenCalledWith('Servicios.pdf')
  })
})
