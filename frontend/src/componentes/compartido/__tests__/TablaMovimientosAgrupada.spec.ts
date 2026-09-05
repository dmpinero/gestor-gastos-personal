import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import type { Movimiento } from '@/api/tipos'
import { formatearImporte } from '@/lib/formato'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import TablaMovimientosAgrupada from '../TablaMovimientosAgrupada.vue'

const movimientos: Movimiento[] = [
  {
    id: 1,
    cuenta_id: 10,
    categoria_id: 100,
    subcategoria_id: 1000,
    fecha_valor: '2026-01-05',
    descripcion: 'Compra en Mercadona',
    comentario: null,
    importe: '-30.00',
    saldo: '970.00',
  },
  {
    id: 2,
    cuenta_id: 10,
    categoria_id: 100,
    subcategoria_id: null,
    fecha_valor: '2026-01-10',
    descripcion: 'Reembolso',
    comentario: null,
    importe: '5.00',
    saldo: '975.00',
  },
  {
    id: 3,
    cuenta_id: 10,
    categoria_id: 200,
    subcategoria_id: null,
    fecha_valor: '2026-01-15',
    descripcion: 'Nómina',
    comentario: null,
    importe: '1500.00',
    saldo: '2475.00',
  },
]

function montar(props: { movimientos: Movimiento[]; seleccionados?: Set<number> }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const tiendaCuentas = useTiendaCuentas()
  tiendaCuentas.cuentas = [
    {
      id: 10,
      numero_cuenta: 'ES00 1111',
      alias: 'Cuenta principal',
      entidad_bancaria: null,
      moneda: 'EUR',
      titular: null,
    },
  ]
  const tiendaCategorias = useTiendaCategorias()
  tiendaCategorias.categorias = [
    {
      categoria: { id: 100, nombre: 'Alimentación' },
      subcategorias: [{ id: 1000, nombre: 'Supermercado', categoria_id: 100 }],
    },
    { categoria: { id: 200, nombre: 'Ingresos' }, subcategorias: [] },
  ]

  return mount(TablaMovimientosAgrupada, {
    attachTo: document.body,
    global: { plugins: [pinia] },
    props,
  })
}

describe('TablaMovimientosAgrupada', () => {
  it('sin movimientos, muestra el mensaje vacío', () => {
    const wrapper = montar({ movimientos: [] })
    expect(wrapper.text()).toContain('No hay movimientos.')
  })

  it('muestra una fila por categoría, colapsada por defecto, con sus totales y número de movimientos', () => {
    const wrapper = montar({ movimientos })

    const filasCategoria = wrapper.findAll('button[aria-expanded]')
    expect(filasCategoria).toHaveLength(2) // Alimentación, Ingresos
    expect(filasCategoria[0]?.attributes('aria-expanded')).toBe('false')

    expect(wrapper.text()).toContain('Alimentación')
    expect(wrapper.text()).toContain('Ingresos')
    expect(wrapper.text()).toContain(formatearImporte(-30))
    expect(wrapper.text()).toContain(formatearImporte(5))
    expect(wrapper.text()).toContain(formatearImporte(1500))
    expect(wrapper.find('table').exists()).toBe(false) // nada expandido todavía
  })

  it('al expandir una categoría, muestra sus subcategorías (con "(sin subcategoría)")', async () => {
    const wrapper = montar({ movimientos })

    await wrapper.get('button[aria-expanded]').trigger('click')

    expect(wrapper.text()).toContain('Supermercado')
    expect(wrapper.text()).toContain('(sin subcategoría)')
  })

  it('al expandir una subcategoría, muestra sus movimientos en una tabla', async () => {
    const wrapper = montar({ movimientos })

    const botones = wrapper.findAll('button[aria-expanded]')
    await botones[0]!.trigger('click') // expandir categoría Alimentación

    const botonSubcategoria = wrapper
      .findAll('button[aria-expanded]')
      .find((b) => b.text().includes('Supermercado'))!
    await botonSubcategoria.trigger('click')

    const tabla = wrapper.find('table')
    expect(tabla.exists()).toBe(true)
    expect(tabla.text()).toContain('Compra en Mercadona')
    // "Nómina" pertenece a otra categoría/subcategoría, no debe aparecer aquí.
    expect(tabla.text()).not.toContain('Nómina')
  })

  it('el botón Editar de un movimiento emite "editar" con ese movimiento', async () => {
    const wrapper = montar({ movimientos })

    await wrapper.get('button[aria-expanded]').trigger('click') // Alimentación
    const botonSubcategoria = wrapper
      .findAll('button[aria-expanded]')
      .find((b) => b.text().includes('Supermercado'))!
    await botonSubcategoria.trigger('click')

    await wrapper.get('table button[aria-label="Editar"]').trigger('click')

    expect(wrapper.emitted('editar')).toHaveLength(1)
    expect(wrapper.emitted('editar')?.[0]).toEqual([movimientos[0]])
  })

  it('cuando todos los movimientos son del mismo signo, solo se muestra esa columna de total', () => {
    const soloIngresos = [movimientos[2]!]
    const wrapper = montar({ movimientos: soloIngresos })

    const filaCategoria = wrapper.get('button[aria-expanded]')
    expect(filaCategoria.findAll('.tabular-nums')).toHaveLength(1)
    expect(filaCategoria.text()).toContain(formatearImporte(1500))
  })

  async function expandirAlimentacionSupermercado(wrapper: ReturnType<typeof montar>) {
    await wrapper.get('button[aria-expanded]').trigger('click') // Alimentación
    const botonSubcategoria = wrapper
      .findAll('button[aria-expanded]')
      .find((b) => b.text().includes('Supermercado'))!
    await botonSubcategoria.trigger('click')
  }

  it('sin la prop "seleccionados", no muestra ninguna casilla de selección', async () => {
    const wrapper = montar({ movimientos })
    await expandirAlimentacionSupermercado(wrapper)

    expect(wrapper.find('table').findAll('[role="checkbox"]')).toHaveLength(0)
  })

  it('con la prop "seleccionados", muestra una casilla por movimiento y una de "seleccionar todos"', async () => {
    const wrapper = montar({ movimientos, seleccionados: new Set() })
    await expandirAlimentacionSupermercado(wrapper)

    // Solo hay un movimiento en Alimentación > Supermercado: 1 casilla de
    // cabecera ("seleccionar todos" de esa subcategoría) + 1 de fila.
    expect(wrapper.find('table').findAll('[role="checkbox"]')).toHaveLength(2)
  })

  it('marcar la casilla de un movimiento emite "alternarSeleccion" con su id', async () => {
    const wrapper = montar({ movimientos, seleccionados: new Set() })
    await expandirAlimentacionSupermercado(wrapper)

    const casillas = wrapper.find('table').findAll('[role="checkbox"]')
    await casillas[1]!.trigger('click') // la de cabecera es la [0]

    expect(wrapper.emitted('alternarSeleccion')).toHaveLength(1)
    expect(wrapper.emitted('alternarSeleccion')?.[0]).toEqual([[1], true])
  })

  it('marcar "seleccionar todos" de una subcategoría emite "alternarSeleccion" con los ids de todos sus movimientos', async () => {
    const dosEnLaMismaSubcategoria: Movimiento[] = [
      movimientos[0]!,
      { ...movimientos[0]!, id: 4, descripcion: 'Otra compra en Mercadona' },
    ]
    const wrapper = montar({ movimientos: dosEnLaMismaSubcategoria, seleccionados: new Set() })
    await expandirAlimentacionSupermercado(wrapper)

    const casillaTodas = wrapper.find('table').findAll('[role="checkbox"]')[0]!
    await casillaTodas.trigger('click')

    expect(wrapper.emitted('alternarSeleccion')).toHaveLength(1)
    expect(wrapper.emitted('alternarSeleccion')?.[0]).toEqual([[1, 4], true])
  })

  it('la casilla "seleccionar todos" aparece marcada cuando todos los movimientos de la subcategoría ya están seleccionados', async () => {
    const wrapper = montar({ movimientos, seleccionados: new Set([1]) })
    await expandirAlimentacionSupermercado(wrapper)

    const casillaTodas = wrapper.find('table').findAll('[role="checkbox"]')[0]!
    expect(casillaTodas.attributes('aria-checked')).toBe('true')
  })
})
