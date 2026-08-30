import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FilaResumenAnual } from '@/api/tipos'
import { useTiendaPrevisiones } from '@/stores/previsiones'
import TablaResumenAnual from '../TablaResumenAnual.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

function crearFila(): FilaResumenAnual {
  return {
    concepto_id: 1,
    categoria_id: 1,
    subcategoria_id: null,
    nombre: 'Amazon Prime',
    periodicidad: 'mensual',
    valores: Array.from({ length: 12 }, (_, indice) => ({
      mes: indice + 1,
      importe: '-9.99',
      origen: 'previsto' as const,
    })).map((valor, indice) => {
      if (indice === 2) return { ...valor, importe: '-4.99', origen: 'real' as const }
      if (indice === 4) return { ...valor, importe: '-1.00', origen: 'ajustado' as const }
      return valor
    }),
  }
}

const totales = Array(12).fill('-9.99')

function montar(
  props: { titulo: string; filas: FilaResumenAnual[]; totales: string[]; mensajeVacio: string },
  opciones: { attachTo?: Element } = {},
) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(TablaResumenAnual, {
    global: { plugins: [pinia] },
    props: { anio: 2026, ...props },
    ...opciones,
  })
}

describe('TablaResumenAnual', () => {
  it('al hacer clic en una celda, la convierte en un campo editable con el valor sin formatear', async () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })

    await wrapper.get('td button').trigger('click')

    const input = wrapper.get('td input')
    expect((input.element as HTMLInputElement).value).toBe('-9.99')
  })

  it('confirmar con Enter emite editar-celda con el nuevo importe', async () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })

    await wrapper.get('td button').trigger('click')
    const input = wrapper.get('td input')
    await input.setValue('-60.00')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('editar-celda')).toEqual([[1, 1, '-60.00']])
  })

  it('vaciar la celda y confirmar emite editar-celda con importe null (revertir)', async () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })

    await wrapper.get('td button').trigger('click')
    const input = wrapper.get('td input')
    await input.setValue('')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('editar-celda')).toEqual([[1, 1, null]])
  })

  it('Escape cancela la edición sin emitir editar-celda', async () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })

    await wrapper.get('td button').trigger('click')
    const input = wrapper.get('td input')
    await input.setValue('-60.00')
    await input.trigger('keydown.escape')

    expect(wrapper.emitted('editar-celda')).toBeUndefined()
    expect(wrapper.find('td input').exists()).toBe(false)
  })

  it('distingue visualmente celdas reales, previstas y ajustadas', () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    // celdas[0] es el nombre; celdas[1..12] son los meses (mes 1 = previsto por defecto).
    expect(celdas[1]?.classes()).toContain('italic') // mes 1 = previsto
    expect(celdas[3]?.classes()).not.toContain('italic') // mes 3 = real
    expect(celdas[5]?.classes()).toContain('border-dashed') // mes 5 = ajustado
  })

  it('colorea en rojo los importes negativos confirmados o ajustados, pero no los previstos', () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    expect(celdas[1]?.classes()).not.toContain('text-destructive') // mes 1 = previsto
    expect(celdas[3]?.classes()).toContain('text-destructive') // mes 3 = real
    expect(celdas[5]?.classes()).toContain('text-destructive') // mes 5 = ajustado

    const celdasTotal = wrapper.findAll('tbody tr')[1]?.findAll('td') ?? []
    expect(celdasTotal[1]?.classes()).toContain('text-destructive')
  })

  it('muestra el número de conceptos, en singular si solo hay uno', () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })

    expect(wrapper.text()).toContain('1 concepto')
    expect(wrapper.text()).not.toContain('1 conceptos')
  })

  it('con varios conceptos, pluraliza el contador', () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila(), { ...crearFila(), concepto_id: 2, nombre: 'Netflix' }],
      totales,
      mensajeVacio: 'Vacío',
    })

    expect(wrapper.text()).toContain('2 conceptos')
  })

  it('sin filas, no muestra el contador (solo el mensaje de vacío)', () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [],
      totales,
      mensajeVacio: 'Nada que mostrar',
    })

    expect(wrapper.text()).toContain('Nada que mostrar')
    expect(wrapper.text()).not.toContain('concepto')
  })

  it('el icono de ver detalle solo aparece en celdas reales o ajustadas, no en las previstas', () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    expect(celdas[1]?.find('button[aria-label^="Ver movimientos"]').exists()).toBe(false) // previsto
    expect(celdas[3]?.find('button[aria-label^="Ver movimientos"]').exists()).toBe(true) // real
    expect(celdas[5]?.find('button[aria-label^="Ver movimientos"]').exists()).toBe(true) // ajustado
  })

  it('al abrir el detalle de un mes, pide los movimientos de ese concepto/año/mes al store', async () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })
    const tienda = useTiendaPrevisiones()
    const espia = vi.spyOn(tienda, 'listarMovimientosDeConcepto').mockResolvedValue([])
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    await celdas[3]!.get('button[aria-label^="Ver movimientos"]').trigger('click')

    expect(espia).toHaveBeenCalledWith(1, 2026, 3)
  })

  it('el botón de cargar acumulado pide confirmación antes de emitir cargar-acumulado-real', async () => {
    const wrapper = montar(
      { titulo: 'Gastos', filas: [crearFila()], totales, mensajeVacio: 'Vacío' },
      { attachTo: document.body },
    )

    await wrapper.get('button[aria-label="Cargar acumulado real"]').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cargar-acumulado-real')).toBeUndefined()
    const botonCargar = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button'),
    ).find((boton) => boton.textContent?.trim() === 'Cargar')
    botonCargar?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('cargar-acumulado-real')).toEqual([[1]])
    wrapper.unmount()
  })
})
