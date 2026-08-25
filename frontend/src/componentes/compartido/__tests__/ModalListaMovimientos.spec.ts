import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import type { Movimiento } from '@/api/tipos'
import { formatearImporte } from '@/lib/formato'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import ModalListaMovimientos from '../ModalListaMovimientos.vue'

const movimientos: Movimiento[] = [
  {
    id: 1,
    cuenta_id: 10,
    categoria_id: 100,
    subcategoria_id: 1000,
    fecha_valor: '2026-01-05',
    descripcion: 'Ba pago',
    comentario: null,
    importe: '-5.00',
    saldo: '95.00',
  },
  {
    id: 2,
    cuenta_id: 10,
    categoria_id: 100,
    subcategoria_id: null,
    fecha_valor: '2026-01-20',
    descripcion: 'Ab pago',
    comentario: null,
    importe: '-50.00',
    saldo: '45.00',
  },
  {
    id: 3,
    cuenta_id: 11,
    categoria_id: 100,
    subcategoria_id: 1000,
    fecha_valor: '2026-01-10',
    descripcion: 'Ca pago',
    comentario: null,
    importe: '-1.00',
    saldo: '44.00',
  },
]

function filasDeLaTabla(): string[][] {
  return Array.from(document.body.querySelectorAll('tbody tr')).map((fila) =>
    Array.from(fila.querySelectorAll('td')).map((c) => c.textContent?.trim() ?? ''),
  )
}

function montar() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const tiendaCuentas = useTiendaCuentas()
  tiendaCuentas.cuentas = [
    {
      id: 10,
      numero_cuenta: 'ES00 1111',
      alias: 'Nómina',
      entidad_bancaria: null,
      moneda: 'EUR',
      titular: null,
    },
    {
      id: 11,
      numero_cuenta: 'ES00 2222',
      alias: null,
      entidad_bancaria: null,
      moneda: 'EUR',
      titular: null,
    },
  ]
  const tiendaCategorias = useTiendaCategorias()
  tiendaCategorias.categorias = [
    {
      categoria: { id: 100, nombre: 'Ocio' },
      subcategorias: [{ id: 1000, nombre: 'Cine', categoria_id: 100 }],
    },
  ]

  return mount(ModalListaMovimientos, {
    attachTo: document.body,
    global: { plugins: [pinia] },
    props: { titulo: 'Total gastado', movimientos },
  })
}

describe('ModalListaMovimientos', () => {
  it('el enlace "Detalles" abre la modal con el título y el número de movimientos', async () => {
    const wrapper = montar()
    await wrapper.get('button').trigger('click')

    const modal = document.body.querySelector('[role="dialog"]')
    expect(modal?.textContent).toContain('Total gastado')
    expect(modal?.textContent).toContain('3 movimientos')
    wrapper.unmount()
  })

  it('sin ordenar, muestra los movimientos en el orden recibido, con cuenta/categoría/subcategoría resueltas', async () => {
    const wrapper = montar()
    await wrapper.get('button').trigger('click')

    const filas = filasDeLaTabla()
    expect(filas.map((fila) => fila[2])).toEqual(['Ba pago', 'Ab pago', 'Ca pago'])
    // Cuenta con alias muestra el alias; sin alias, el número de cuenta.
    expect(filas[0]).toEqual([
      'Nómina',
      '05/01/2026',
      'Ba pago',
      'Ocio',
      'Cine',
      formatearImporte('-5.00'),
      formatearImporte('95.00'),
    ])
    expect(filas[1]?.[0]).toBe('Nómina')
    expect(filas[1]?.[4]).toBe('') // sin subcategoría
    expect(filas[2]?.[0]).toBe('ES00 2222')
    wrapper.unmount()
  })

  it('al pulsar la cabecera Descripción, ordena alfabéticamente; al pulsar de nuevo, invierte', async () => {
    const wrapper = montar()
    await wrapper.get('button').trigger('click')

    const cabeceraDescripcion = document.body.querySelectorAll(
      'thead button',
    )[2] as HTMLButtonElement
    cabeceraDescripcion.click()
    await wrapper.vm.$nextTick()
    expect(filasDeLaTabla().map((fila) => fila[2])).toEqual(['Ab pago', 'Ba pago', 'Ca pago'])

    cabeceraDescripcion.click()
    await wrapper.vm.$nextTick()
    expect(filasDeLaTabla().map((fila) => fila[2])).toEqual(['Ca pago', 'Ba pago', 'Ab pago'])
    wrapper.unmount()
  })

  it('al pulsar la cabecera Importe, ordena numéricamente (no como texto)', async () => {
    const wrapper = montar()
    await wrapper.get('button').trigger('click')

    const cabeceraImporte = document.body.querySelectorAll('thead button')[5] as HTMLButtonElement
    cabeceraImporte.click()
    await wrapper.vm.$nextTick()

    expect(filasDeLaTabla().map((fila) => fila[5])).toEqual([
      formatearImporte('-50.00'),
      formatearImporte('-5.00'),
      formatearImporte('-1.00'),
    ])
    wrapper.unmount()
  })
})
