import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FilaResumenAnual, Movimiento } from '@/api/tipos'
import { formatearImporte } from '@/lib/formato'
import { useTiendaPrevisiones } from '@/stores/previsiones'
import TablaResumenAnual from '../TablaResumenAnual.vue'

// jsdom no implementa ResizeObserver; Reka UI lo usa internamente para
// posicionar el contenido del Tooltip, así que sin este stub la primera
// apertura del tooltip lanza un rechazo no controlado que corrompe el DOM
// de los tests siguientes.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub)

function crearMovimiento(datos: Partial<Movimiento> = {}): Movimiento {
  return {
    id: 1,
    cuenta_id: 1,
    categoria_id: 1,
    subcategoria_id: null,
    fecha_valor: '2026-03-15',
    descripcion: 'Amazon Prime',
    comentario: null,
    importe: '-4.99',
    saldo: '100.00',
    ...datos,
  }
}

async function esperarMicrotareas(): Promise<void> {
  await new Promise((resolver) => setTimeout(resolver, 0))
}

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

  it('resalta con fondo los meses previstos que todavía no han llegado (cargo a futuro)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15'))
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    // mes 1 = previsto pero ya pasado (no es un cargo a futuro).
    expect(celdas[1]?.classes()).not.toContain('bg-blue-50')
    // mes 8 = previsto y todavía no ha llegado.
    expect(celdas[8]?.classes()).toContain('bg-blue-50')
    vi.useRealTimers()
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

  it('muestra por separado el saldo previsto (todos los meses) y el actual (solo meses con dato real o ajustado)', () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })

    // crearFila(): 10 meses a -9,99 previsto, mes 3 a -4,99 real, mes 5 a -1,00 ajustado.
    expect(wrapper.text()).toContain(`Saldo año 2026 (previsto): ${formatearImporte('-105.89')}`)
    expect(wrapper.text()).toContain(`Saldo año 2026 (actual): ${formatearImporte('-5.99')}`)
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

  it('al cambiar de año, vuelve a pedir el detalle en vez de reutilizar el del año anterior', async () => {
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
    await wrapper.setProps({ anio: 2027 })
    await celdas[3]!.get('button[aria-label^="Ver movimientos"]').trigger('click')

    expect(espia).toHaveBeenCalledTimes(2)
    expect(espia).toHaveBeenNthCalledWith(1, 1, 2026, 3)
    expect(espia).toHaveBeenNthCalledWith(2, 1, 2027, 3)
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

  it('al pasar el ratón por un importe real, pide los movimientos si aún no estaban cargados', async () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })
    const tienda = useTiendaPrevisiones()
    const espia = vi.spyOn(tienda, 'listarMovimientosDeConcepto').mockResolvedValue([])
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    await celdas[3]!.get('button').trigger('mouseenter')

    expect(espia).toHaveBeenCalledWith(1, 2026, 3)
  })

  it('al pasar el ratón por una celda prevista no pide ningún movimiento', async () => {
    const wrapper = montar({
      titulo: 'Gastos',
      filas: [crearFila()],
      totales,
      mensajeVacio: 'Vacío',
    })
    const tienda = useTiendaPrevisiones()
    const espia = vi.spyOn(tienda, 'listarMovimientosDeConcepto').mockResolvedValue([])
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    await celdas[1]!.get('button').trigger('mouseenter') // mes 1 = previsto

    expect(espia).not.toHaveBeenCalled()
  })

  it('muestra el comentario del único movimiento que compone el importe', async () => {
    const wrapper = montar(
      { titulo: 'Gastos', filas: [crearFila()], totales, mensajeVacio: 'Vacío' },
      { attachTo: document.body },
    )
    const tienda = useTiendaPrevisiones()
    vi.spyOn(tienda, 'listarMovimientosDeConcepto').mockResolvedValue([
      crearMovimiento({ comentario: 'Revisar cargo duplicado' }),
    ])
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    await celdas[3]!.get('button').trigger('focus')
    await esperarMicrotareas()
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('Revisar cargo duplicado')
    wrapper.unmount()
  })

  it('muestra la descripción del movimiento si no tiene comentario', async () => {
    const wrapper = montar(
      { titulo: 'Gastos', filas: [crearFila()], totales, mensajeVacio: 'Vacío' },
      { attachTo: document.body },
    )
    const tienda = useTiendaPrevisiones()
    vi.spyOn(tienda, 'listarMovimientosDeConcepto').mockResolvedValue([
      crearMovimiento({ descripcion: 'Amazon Prime', comentario: null }),
    ])
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    await celdas[3]!.get('button').trigger('focus')
    await esperarMicrotareas()
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('[data-slot="tooltip-content"]')).not.toBeNull()
    expect(document.body.textContent).toContain('Amazon Prime')
    wrapper.unmount()
  })

  it('con varios movimientos, el tooltip lista todos con su descripción, y el comentario si lo tienen', async () => {
    const wrapper = montar(
      { titulo: 'Gastos', filas: [crearFila()], totales, mensajeVacio: 'Vacío' },
      { attachTo: document.body },
    )
    const tienda = useTiendaPrevisiones()
    vi.spyOn(tienda, 'listarMovimientosDeConcepto').mockResolvedValue([
      crearMovimiento({ id: 1, descripcion: 'Supermercado', comentario: 'Compra semanal' }),
      crearMovimiento({ id: 2, descripcion: 'Bizum a Juan', comentario: null }),
    ])
    const celdas = wrapper.findAll('tbody tr')[0]?.findAll('td') ?? []

    await celdas[3]!.get('button').trigger('focus')
    await esperarMicrotareas()
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('Supermercado: Compra semanal')
    expect(document.body.textContent).toContain('Bizum a Juan')
    wrapper.unmount()
  })
})
