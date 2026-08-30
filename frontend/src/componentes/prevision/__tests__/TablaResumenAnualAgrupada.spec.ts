import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import type { FilaResumenAnual } from '@/api/tipos'
import { formatearImporte } from '@/lib/formato'
import { useTiendaCategorias } from '@/stores/categorias'
import TablaResumenAnualAgrupada from '../TablaResumenAnualAgrupada.vue'

function crearFila(datos: Partial<FilaResumenAnual> = {}): FilaResumenAnual {
  return {
    concepto_id: 1,
    categoria_id: 100,
    subcategoria_id: null,
    nombre: 'Amazon Prime',
    periodicidad: 'mensual',
    valores: Array.from({ length: 12 }, (_, indice) => ({
      mes: indice + 1,
      importe: '-9.99',
      origen: 'previsto' as const,
    })),
    ...datos,
  }
}

function montar(props: { titulo: string; filas: FilaResumenAnual[]; mensajeVacio: string }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const tiendaCategorias = useTiendaCategorias()
  tiendaCategorias.categorias = [
    { categoria: { id: 100, nombre: 'Suscripciones' }, subcategorias: [] },
    { categoria: { id: 200, nombre: 'Alimentación' }, subcategorias: [] },
  ]

  return mount(TablaResumenAnualAgrupada, {
    global: { plugins: [pinia] },
    props: { anio: 2026, ...props },
  })
}

describe('TablaResumenAnualAgrupada', () => {
  it('sin filas, muestra el mensaje vacío', () => {
    const wrapper = montar({ titulo: 'Gastos', filas: [], mensajeVacio: 'Nada que mostrar' })
    expect(wrapper.text()).toContain('Nada que mostrar')
  })

  it('muestra una fila por categoría, colapsada por defecto, con su total anual y número de conceptos', () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [
        crearFila({ concepto_id: 1, categoria_id: 100 }),
        crearFila({ concepto_id: 2, categoria_id: 200, nombre: 'Supermercado' }),
      ],
      mensajeVacio: 'Vacío',
    })

    const filasCategoria = wrapper.findAll('button[aria-expanded]')
    expect(filasCategoria).toHaveLength(2)
    expect(filasCategoria[0]?.attributes('aria-expanded')).toBe('false')
    expect(wrapper.text()).toContain('Suscripciones')
    expect(wrapper.text()).toContain('Alimentación')
    expect(wrapper.text()).toContain(formatearImporte(-9.99 * 12))
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('al expandir una categoría, muestra la tabla de conceptos de esa categoría', async () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [
        crearFila({ concepto_id: 1, categoria_id: 100, nombre: 'Amazon Prime' }),
        crearFila({ concepto_id: 2, categoria_id: 200, nombre: 'Supermercado' }),
      ],
      mensajeVacio: 'Vacío',
    })

    const boton = wrapper
      .findAll('button[aria-expanded]')
      .find((b) => b.text().includes('Suscripciones'))!
    await boton.trigger('click')

    const tabla = wrapper.find('table')
    expect(tabla.exists()).toBe(true)
    expect(tabla.text()).toContain('Amazon Prime')
    expect(tabla.text()).not.toContain('Supermercado')
  })

  it('editar-celda dentro de una categoría expandida se reenvía tal cual', async () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila({ concepto_id: 1, categoria_id: 100 })],
      mensajeVacio: 'Vacío',
    })

    await wrapper.get('button[aria-expanded]').trigger('click')
    await wrapper.get('td button').trigger('click')
    const input = wrapper.get('td input')
    await input.setValue('-60.00')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('editar-celda')).toEqual([[1, 1, '-60.00']])
  })
})
