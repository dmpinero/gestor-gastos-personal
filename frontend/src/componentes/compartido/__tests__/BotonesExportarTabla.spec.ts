import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
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

describe('BotonesExportarTabla', () => {
  it('el botón Exportar a Excel llama a exportarTablaExcel con el nombre de fichero y los datos', async () => {
    const wrapper = mount(BotonesExportarTabla, { props: propsBase })

    await wrapper.get('[aria-label="Exportar a Excel"]').trigger('click')

    expect(exportarTablaExcel).toHaveBeenCalledWith(
      'Movimientos.xlsx',
      propsBase.columnas,
      propsBase.filas,
    )
  })

  it('el botón Exportar a PDF llama a exportarTablaPDF con el nombre de fichero, título y datos', async () => {
    const wrapper = mount(BotonesExportarTabla, { props: propsBase })

    await wrapper.get('[aria-label="Exportar a PDF"]').trigger('click')

    expect(exportarTablaPDF).toHaveBeenCalledWith(
      'Movimientos.pdf',
      'Movimientos',
      propsBase.columnas,
      propsBase.filas,
    )
  })
})
