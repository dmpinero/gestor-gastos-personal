import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { formatearImporte } from '@/lib/formato'
import ModalDetalleMovimientos from '../ModalDetalleMovimientos.vue'

const movimientos = [
  { fecha: '2026-01-05', descripcion: 'Ba pago', subcategoria: 'Zeta', importe: '-5.00' },
  { fecha: '2026-01-20', descripcion: 'Ab pago', subcategoria: 'Alfa', importe: '-50.00' },
  { fecha: '2026-01-10', descripcion: 'Ca pago', subcategoria: 'Beta', importe: '-1.00' },
]

function filasDeLaTabla(): string[][] {
  return Array.from(document.body.querySelectorAll('tbody tr')).map((fila) =>
    Array.from(fila.querySelectorAll('td')).map((c) => c.textContent?.trim() ?? ''),
  )
}

describe('ModalDetalleMovimientos', () => {
  it('sin ordenar, muestra los movimientos en el orden recibido', async () => {
    const wrapper = mount(ModalDetalleMovimientos, {
      attachTo: document.body,
      props: { nombreCategoria: 'Servicios', total: '-56.00', movimientos },
    })
    await wrapper.get('button').trigger('click')

    const primeraCelda = filasDeLaTabla().map((fila) => fila[1])
    expect(primeraCelda).toEqual(['Ba pago', 'Ab pago', 'Ca pago'])
    wrapper.unmount()
  })

  it('al pulsar la cabecera Descripción, ordena alfabéticamente; al pulsar de nuevo, invierte', async () => {
    const wrapper = mount(ModalDetalleMovimientos, {
      attachTo: document.body,
      props: { nombreCategoria: 'Servicios', total: '-56.00', movimientos },
    })
    await wrapper.get('button').trigger('click')

    const cabeceraDescripcion = document.body.querySelectorAll(
      'thead button',
    )[1] as HTMLButtonElement
    cabeceraDescripcion.click()
    await wrapper.vm.$nextTick()

    expect(filasDeLaTabla().map((fila) => fila[1])).toEqual(['Ab pago', 'Ba pago', 'Ca pago'])

    cabeceraDescripcion.click()
    await wrapper.vm.$nextTick()

    expect(filasDeLaTabla().map((fila) => fila[1])).toEqual(['Ca pago', 'Ba pago', 'Ab pago'])
    wrapper.unmount()
  })

  it('al pulsar la cabecera Importe, ordena numéricamente (no como texto)', async () => {
    const wrapper = mount(ModalDetalleMovimientos, {
      attachTo: document.body,
      props: { nombreCategoria: 'Servicios', total: '-56.00', movimientos },
    })
    await wrapper.get('button').trigger('click')

    const cabeceraImporte = document.body.querySelectorAll('thead button')[3] as HTMLButtonElement
    cabeceraImporte.click()
    await wrapper.vm.$nextTick()

    expect(filasDeLaTabla().map((fila) => fila[4])).toEqual([
      formatearImporte('-50.00'),
      formatearImporte('-5.00'),
      formatearImporte('-1.00'),
    ])
    wrapper.unmount()
  })
})
