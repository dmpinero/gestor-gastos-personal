import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { formatearImporte } from '@/lib/formato'
import { useTiendaMovimientos } from '@/stores/movimientos'
import ModalDetalleMovimientos from '../ModalDetalleMovimientos.vue'
import type { MovimientoDeCategoria } from '../ListaTotalesCategoria.vue'

const movimientos: MovimientoDeCategoria[] = [
  {
    id: 1,
    cuenta_id: 1,
    categoria_id: 1,
    subcategoria_id: 10,
    fecha: '2026-01-05',
    descripcion: 'Ba pago',
    comentario: null,
    subcategoria: 'Zeta',
    importe: '-5.00',
    saldo: '95.00',
  },
  {
    id: 2,
    cuenta_id: 1,
    categoria_id: 1,
    subcategoria_id: 20,
    fecha: '2026-01-20',
    descripcion: 'Ab pago',
    comentario: null,
    subcategoria: 'Alfa',
    importe: '-50.00',
    saldo: '45.00',
  },
  {
    id: 3,
    cuenta_id: 1,
    categoria_id: 1,
    subcategoria_id: 30,
    fecha: '2026-01-10',
    descripcion: 'Ca pago',
    comentario: null,
    subcategoria: 'Beta',
    importe: '-1.00',
    saldo: '44.00',
  },
]

function filasDeLaTabla(): string[][] {
  return Array.from(document.body.querySelectorAll('tbody tr')).map((fila) =>
    Array.from(fila.querySelectorAll('td')).map((c) => c.textContent?.trim() ?? ''),
  )
}

function montar(props: {
  nombreCategoria: string
  total: string
  movimientos: MovimientoDeCategoria[]
}) {
  setActivePinia(createPinia())
  return mount(ModalDetalleMovimientos, {
    attachTo: document.body,
    props,
  })
}

describe('ModalDetalleMovimientos', () => {
  it('sin ordenar, muestra los movimientos en el orden recibido', async () => {
    const wrapper = montar({ nombreCategoria: 'Servicios', total: '-56.00', movimientos })
    await wrapper.get('button').trigger('click')

    const primeraCelda = filasDeLaTabla().map((fila) => fila[1])
    expect(primeraCelda).toEqual(['Ba pago', 'Ab pago', 'Ca pago'])
    wrapper.unmount()
  })

  it('al pulsar la cabecera Descripción, ordena alfabéticamente; al pulsar de nuevo, invierte', async () => {
    const wrapper = montar({ nombreCategoria: 'Servicios', total: '-56.00', movimientos })
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
    const wrapper = montar({ nombreCategoria: 'Servicios', total: '-56.00', movimientos })
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

  it('muestra el número de movimientos junto al total', async () => {
    const wrapper = montar({ nombreCategoria: 'Servicios', total: '-56.00', movimientos })
    await wrapper.get('button').trigger('click')

    const descripcion = document.body.querySelector('[role="dialog"]')?.textContent ?? ''
    expect(descripcion).toContain('3 movimientos')
    wrapper.unmount()
  })

  it('con un solo movimiento, usa el singular', async () => {
    const wrapper = montar({
      nombreCategoria: 'Servicios',
      total: '-5.00',
      movimientos: [movimientos[0]!],
    })
    await wrapper.get('button').trigger('click')

    const descripcion = document.body.querySelector('[role="dialog"]')?.textContent ?? ''
    expect(descripcion).toContain('1 movimiento')
    expect(descripcion).not.toContain('1 movimientos')
    wrapper.unmount()
  })

  it('el botón Editar de una fila abre el panel de edición sobre la modal, sin cerrarla', async () => {
    const wrapper = montar({ nombreCategoria: 'Servicios', total: '-56.00', movimientos })
    await wrapper.get('button').trigger('click')

    const tiendaMovimientos = useTiendaMovimientos()
    vi.spyOn(tiendaMovimientos, 'actualizar').mockResolvedValue({
      id: 1,
      cuenta_id: 1,
      categoria_id: 1,
      subcategoria_id: 10,
      fecha_valor: '2026-01-05',
      descripcion: 'Ba pago editado',
      comentario: null,
      importe: '-5.00',
      saldo: '95.00',
    })

    const botonesEditar = document.body.querySelectorAll('tbody button[aria-label="Editar"]')
    ;(botonesEditar[0] as HTMLButtonElement).click()
    await nextTick()

    const dialogos = document.body.querySelectorAll('[role="dialog"]')
    expect(dialogos.length).toBeGreaterThanOrEqual(2)
    expect(document.body.querySelector('[data-slot="sheet-title"]')?.textContent).toBe(
      'Editar movimiento',
    )
    expect((document.body.querySelector('#descripcion') as HTMLInputElement).value).toBe('Ba pago')

    const formulario = document.body.querySelector('form') as HTMLFormElement
    formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()

    expect(tiendaMovimientos.actualizar).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ descripcion: 'Ba pago', subcategoria_id: 10 }),
    )
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    wrapper.unmount()
  })
})
