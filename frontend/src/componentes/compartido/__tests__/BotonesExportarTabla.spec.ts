import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportarTablaExcel, exportarTablaPDF } from '@/lib/exportarTabla'
import BotonesExportarTabla from '../BotonesExportarTabla.vue'

vi.mock('@/lib/exportarTabla', () => ({
  exportarTablaExcel: vi.fn<(...args: unknown[]) => Promise<void>>(),
  exportarTablaPDF: vi.fn<(...args: unknown[]) => Promise<void>>(),
}))

const propsBase = {
  nombreFichero: 'Movimientos',
  titulo: 'Movimientos',
  columnas: ['Fecha', 'Importe'],
  filas: [['05/01/2026', '-45,00 €']],
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 5, 9, 3, 7))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('BotonesExportarTabla', () => {
  it('el botón Exportar a Excel llama a exportarTablaExcel con el nombre de fichero y marca temporal', async () => {
    const wrapper = mount(BotonesExportarTabla, { props: propsBase })

    await wrapper.get('[aria-label="Exportar a Excel"]').trigger('click')

    expect(exportarTablaExcel).toHaveBeenCalledWith(
      'Movimientos_05012026_090307.xlsx',
      propsBase.columnas,
      propsBase.filas,
    )
  })

  it('el botón Exportar a PDF llama a exportarTablaPDF con el nombre de fichero, marca temporal, título y datos', async () => {
    const wrapper = mount(BotonesExportarTabla, { props: propsBase })

    await wrapper.get('[aria-label="Exportar a PDF"]').trigger('click')

    expect(exportarTablaPDF).toHaveBeenCalledWith(
      'Movimientos_05012026_090307.pdf',
      'Movimientos',
      propsBase.columnas,
      propsBase.filas,
    )
  })
})
