import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { formatearImporte, formatearPeriodo } from '@/lib/formato'
import GraficoComparativoEvolucion from '../GraficoComparativoEvolucion.vue'

describe('GraficoComparativoEvolucion', () => {
  it('no renderiza nada cuando no hay periodos en ninguna serie', () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: { itemsGastos: [], itemsIngresos: [] },
    })

    expect(wrapper.text()).toBe('')
  })

  it('renderiza una pareja de barras por cada periodo de la unión de ambas series', () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [
          { periodo: '2026-01', total: 30 },
          { periodo: '2026-02', total: 10 },
        ],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    // 2026-02 solo tiene gasto: la barra de ingreso de ese periodo existe con altura 0.
    expect(wrapper.text()).toContain(formatearPeriodo('2026-01'))
    expect(wrapper.text()).toContain(formatearPeriodo('2026-02'))
    expect(wrapper.findAll('[role="group"] .bg-destructive')).toHaveLength(2)
    expect(wrapper.findAll('[role="group"] .bg-success')).toHaveLength(2)
  })

  it('la barra del valor máximo (de cualquiera de las dos series) ocupa el 100% de la altura', () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 30 }],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    const barraGasto = wrapper.find('[role="group"] .bg-destructive')
    const barraIngreso = wrapper.find('[role="group"] .bg-success')
    expect(barraIngreso.attributes('style')).toContain('height: 100%')
    expect(barraGasto.attributes('style')).toContain('height: 30%')
  })

  it('el modo barras muestra el importe de cada serie sobre su barra', () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 30 }],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    expect(wrapper.text()).toContain(formatearImporte(30))
    expect(wrapper.text()).toContain(formatearImporte(100))
  })

  it('junto al gráfico de barras, muestra una tabla a ancho completo con el saldo de cada mes', () => {
    // itemsGastos llega como magnitud positiva (ya con Math.abs aplicado por
    // quien llama, ver VistaMovimientos.vue), no como importe negativo.
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 30 }],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    const tabla = wrapper.find('table')
    expect(tabla.exists()).toBe(true)
    expect(tabla.classes()).toContain('w-full')
    expect(tabla.find('thead').text()).toContain('Periodo')
    expect(tabla.find('thead').text()).toContain('Saldo')

    // Saldo = 100 - 30 = 70, positivo → verde (text-success).
    const filas = wrapper.findAll('tbody tr')
    expect(filas).toHaveLength(1)
    const celdaSaldo = filas[0]!.findAll('td')[1]!
    expect(celdaSaldo.text()).toContain(formatearImporte(70))
    expect(celdaSaldo.classes()).toContain('text-success')
  })

  it('con gasto mayor que ingreso, el saldo del mes se muestra en rojo', () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 130 }],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    const celdaSaldo = wrapper.findAll('tbody tr td')[1]!
    expect(celdaSaldo.text()).toContain(formatearImporte(-30))
    expect(celdaSaldo.classes()).toContain('text-destructive')
  })

  it('en modo líneas, también se muestra la tabla de saldo por mes', async () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 30 }],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    await wrapper.get('[aria-label="Ver como líneas"]').trigger('click')

    const celdaSaldo = wrapper.findAll('tbody tr td')[1]!
    expect(celdaSaldo.text()).toContain(formatearImporte(70))
    expect(celdaSaldo.classes()).toContain('text-success')
  })

  it('la tabla de saldo por mes se puede contraer y expandir', async () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 30 }],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    expect(wrapper.find('table').exists()).toBe(true) // abierta por defecto

    await wrapper.get('[aria-label="Contraer saldo por mes"]').trigger('click')
    expect(wrapper.find('table').exists()).toBe(false)

    await wrapper.get('[aria-label="Expandir saldo por mes"]').trigger('click')
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('en modo circular no se muestra la tabla de saldo por mes', async () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 30 }],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    await wrapper.get('[aria-label="Ver como circular"]').trigger('click')

    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('muestra barras por defecto y cambia a líneas al pulsar el botón correspondiente', async () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 30 }],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    expect(wrapper.find('svg[role="img"]').exists()).toBe(false)

    await wrapper.get('[aria-label="Ver como líneas"]').trigger('click')

    expect(wrapper.find('svg[role="img"]').exists()).toBe(true)
    // Un círculo por serie y por periodo (1 periodo x 2 series = 2 círculos).
    expect(wrapper.findAll('svg[role="img"] circle')).toHaveLength(2)
    // Un texto de importe por serie y por periodo (1 periodo x 2 series = 2 textos).
    expect(wrapper.findAll('svg[role="img"] text')).toHaveLength(2)
    expect(wrapper.find('svg[role="img"]').text()).toContain(formatearImporte(30))
    expect(wrapper.find('svg[role="img"]').text()).toContain(formatearImporte(100))
  })

  it('el modo área añade un polígono de relleno por cada serie', async () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 30 }],
        itemsIngresos: [{ periodo: '2026-01', total: 100 }],
      },
    })

    await wrapper.get('[aria-label="Ver como área"]').trigger('click')

    expect(wrapper.findAll('polygon')).toHaveLength(2)
    expect(wrapper.findAll('polyline')).toHaveLength(2)
  })

  it('el modo circular compara el total de gastos frente al de ingresos, con su porcentaje', async () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [
          { periodo: '2026-01', total: 30 },
          { periodo: '2026-02', total: 10 },
        ],
        itemsIngresos: [{ periodo: '2026-01', total: 120 }],
      },
    })

    await wrapper.get('[aria-label="Ver como circular"]').trigger('click')

    expect(wrapper.findAll('svg[role="img"] path')).toHaveLength(2)
    expect(wrapper.text()).toContain('Gastos')
    expect(wrapper.text()).toContain(formatearImporte(40))
    expect(wrapper.text()).toContain('Ingresos')
    expect(wrapper.text()).toContain(formatearImporte(120))
    expect(wrapper.text()).toContain('25%')
    expect(wrapper.text()).toContain('75%')
  })

  it('el modo circular con una sola serie con datos dibuja un círculo completo', async () => {
    const wrapper = mount(GraficoComparativoEvolucion, {
      props: {
        itemsGastos: [{ periodo: '2026-01', total: 30 }],
        itemsIngresos: [],
      },
    })

    await wrapper.get('[aria-label="Ver como circular"]').trigger('click')

    expect(wrapper.find('svg[role="img"] circle').exists()).toBe(true)
    expect(wrapper.findAll('svg[role="img"] path')).toHaveLength(0)
    const listaCircular = wrapper.find('ul')
    expect(listaCircular.text()).toContain('100%')
    expect(listaCircular.text()).not.toContain('Ingresos')
  })
})
