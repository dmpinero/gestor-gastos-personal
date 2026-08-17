import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ZonaSoltarFichero from '../ZonaSoltarFichero.vue'

function crearFicheroDeEjemplo(): File {
  return new File(['contenido'], 'movimientos.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('ZonaSoltarFichero', () => {
  it('emite fichero-elegido al soltar un fichero sobre la zona', async () => {
    const wrapper = mount(ZonaSoltarFichero, { props: { ficheroSeleccionado: null } })
    const fichero = crearFicheroDeEjemplo()

    await wrapper.get('[role="button"]').trigger('drop', {
      dataTransfer: { files: [fichero] },
    })

    const emitido = wrapper.emitted('fichero-elegido')
    expect(emitido).toHaveLength(1)
    expect(emitido?.[0]?.[0]).toBe(fichero)
  })

  it('emite fichero-elegido al seleccionar un fichero por click (input nativo)', async () => {
    const wrapper = mount(ZonaSoltarFichero, { props: { ficheroSeleccionado: null } })
    const fichero = crearFicheroDeEjemplo()
    const input = wrapper.get('input[type="file"]').element as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [fichero] })

    await wrapper.get('input[type="file"]').trigger('change')

    const emitido = wrapper.emitted('fichero-elegido')
    expect(emitido).toHaveLength(1)
    expect(emitido?.[0]?.[0]).toBe(fichero)
  })

  it('marca la zona como "dragover" al arrastrar encima y lo quita al salir', async () => {
    const wrapper = mount(ZonaSoltarFichero, { props: { ficheroSeleccionado: null } })
    const zona = wrapper.get('[role="button"]')

    await zona.trigger('dragenter')
    expect(zona.attributes('data-dragover')).toBe('true')

    await zona.trigger('dragleave')
    expect(zona.attributes('data-dragover')).toBe('false')
  })

  it('el input de fichero nativo permanece en el DOM aunque oculto visualmente', () => {
    const wrapper = mount(ZonaSoltarFichero, { props: { ficheroSeleccionado: null } })
    const input = wrapper.get('input[type="file"]')

    expect(input.attributes('class')).toContain('sr-only')
    expect(input.attributes('accept')).toBe('.xls,.xlsx')
  })
})
