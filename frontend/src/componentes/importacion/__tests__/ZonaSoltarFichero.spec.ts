import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ZonaSoltarFichero from '../ZonaSoltarFichero.vue'

function crearFicheroDeEjemplo(nombre = 'movimientos.xlsx'): File {
  return new File(['contenido'], nombre, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('ZonaSoltarFichero', () => {
  it('emite ficheros-elegidos al soltar un fichero sobre la zona', async () => {
    const wrapper = mount(ZonaSoltarFichero, { props: { ficherosSeleccionados: [] } })
    const fichero = crearFicheroDeEjemplo()

    await wrapper.get('[role="button"]').trigger('drop', {
      dataTransfer: { files: [fichero] },
    })

    const emitido = wrapper.emitted('ficheros-elegidos')
    expect(emitido).toHaveLength(1)
    expect(emitido?.[0]?.[0]).toEqual([fichero])
  })

  it('emite ficheros-elegidos con varios ficheros a la vez al soltarlos juntos', async () => {
    const wrapper = mount(ZonaSoltarFichero, { props: { ficherosSeleccionados: [] } })
    const ficheroA = crearFicheroDeEjemplo('a.xlsx')
    const ficheroB = crearFicheroDeEjemplo('b.xlsx')

    await wrapper.get('[role="button"]').trigger('drop', {
      dataTransfer: { files: [ficheroA, ficheroB] },
    })

    const emitido = wrapper.emitted('ficheros-elegidos')
    expect(emitido).toHaveLength(1)
    expect(emitido?.[0]?.[0]).toEqual([ficheroA, ficheroB])
  })

  it('emite ficheros-elegidos al seleccionar ficheros por click (input nativo)', async () => {
    const wrapper = mount(ZonaSoltarFichero, { props: { ficherosSeleccionados: [] } })
    const fichero = crearFicheroDeEjemplo()
    const input = wrapper.get('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [fichero] })

    await wrapper.get('input[type="file"]').trigger('change')

    const emitido = wrapper.emitted('ficheros-elegidos')
    expect(emitido).toHaveLength(1)
    expect(emitido?.[0]?.[0]).toEqual([fichero])
  })

  it('marca la zona como "dragover" al arrastrar encima y lo quita al salir', async () => {
    const wrapper = mount(ZonaSoltarFichero, { props: { ficherosSeleccionados: [] } })
    const zona = wrapper.get('[role="button"]')

    await zona.trigger('dragenter')
    expect(zona.attributes('data-dragover')).toBe('true')

    await zona.trigger('dragleave')
    expect(zona.attributes('data-dragover')).toBe('false')
  })

  it('el input de fichero nativo admite selección múltiple y permanece oculto en el DOM', () => {
    const wrapper = mount(ZonaSoltarFichero, { props: { ficherosSeleccionados: [] } })
    const input = wrapper.get('input[type="file"]')

    expect(input.attributes('class')).toContain('sr-only')
    expect(input.attributes('accept')).toBe('.xls,.xlsx')
    expect(input.attributes('multiple')).toBeDefined()
  })

  it('muestra la lista de ficheros ya seleccionados', () => {
    const ficheros = [crearFicheroDeEjemplo('a.xlsx'), crearFicheroDeEjemplo('b.xlsx')]
    const wrapper = mount(ZonaSoltarFichero, { props: { ficherosSeleccionados: ficheros } })

    expect(wrapper.text()).toContain('a.xlsx')
    expect(wrapper.text()).toContain('b.xlsx')
  })

  it('permite personalizar la etiqueta accesible y las extensiones aceptadas', () => {
    const wrapper = mount(ZonaSoltarFichero, {
      props: {
        ficherosSeleccionados: [],
        etiqueta: 'archivos Excel de conceptos previstos',
        accept: '.xlsx',
      },
    })

    expect(wrapper.get('[role="button"]').attributes('aria-label')).toBe(
      'Seleccionar o soltar uno o varios archivos Excel de conceptos previstos',
    )
    expect(wrapper.get('input[type="file"]').attributes('accept')).toBe('.xlsx')
  })
})
