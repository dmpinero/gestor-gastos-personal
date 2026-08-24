import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import DialogoConfirmarEliminacion from '../DialogoConfirmarEliminacion.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('DialogoConfirmarEliminacion', () => {
  it('sin disparadorSolido, el trigger por defecto es un enlace', () => {
    const wrapper = mount(DialogoConfirmarEliminacion, {
      props: { descripcion: 'la cuenta ES00 1234', textoBoton: 'Eliminar seleccionados' },
    })

    const boton = wrapper.get('button')
    expect(boton.classes()).toContain('text-destructive')
    expect(boton.classes().join(' ')).toMatch(/underline-offset-4/)
  })

  it('con disparadorSolido, el trigger por defecto es un botón sólido destructive', () => {
    const wrapper = mount(DialogoConfirmarEliminacion, {
      props: {
        descripcion: '3 cuentas seleccionadas',
        textoBoton: 'Eliminar seleccionados',
        disparadorSolido: true,
      },
    })

    const boton = wrapper.get('button')
    expect(boton.classes().join(' ')).toContain('bg-destructive')
    expect(boton.classes().join(' ')).not.toMatch(/underline-offset-4/)
  })

  it('cancelar no emite confirmar', async () => {
    const wrapper = mount(DialogoConfirmarEliminacion, {
      props: { descripcion: 'la cuenta ES00 1234' },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    const botonCancelar = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button'),
    ).find((boton) => boton.textContent?.trim() === 'Cancelar')
    botonCancelar?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirmar')).toBeUndefined()
    wrapper.unmount()
  })

  it('confirmar en el diálogo emite confirmar con cascada en false por defecto', async () => {
    const wrapper = mount(DialogoConfirmarEliminacion, {
      props: { descripcion: 'la cuenta ES00 1234' },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    const botonesDialogo = document.body.querySelectorAll<HTMLButtonElement>(
      '[role="alertdialog"] button',
    )
    const botonConfirmar = Array.from(botonesDialogo).find(
      (boton) => boton.textContent === 'Eliminar',
    )
    botonConfirmar?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirmar')).toEqual([[false]])
    wrapper.unmount()
  })

  it('sin dependencias no añade texto de cascada y confirma con cascada en false', async () => {
    const wrapper = mount(DialogoConfirmarEliminacion, {
      props: {
        descripcion: 'la cuenta ES00 1234',
        obtenerDependencias: () => Promise.resolve([{ etiqueta: 'movimientos', cantidad: 0 }]),
      },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 0))
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).not.toContain('También se eliminarán')

    const botonConfirmar = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button'),
    ).find((boton) => boton.textContent?.trim() === 'Eliminar')
    botonConfirmar?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirmar')).toEqual([[false]])
    wrapper.unmount()
  })

  it('con dependencias muestra el texto de cascada y confirma con cascada en true', async () => {
    const wrapper = mount(DialogoConfirmarEliminacion, {
      props: {
        descripcion: 'la cuenta ES00 1234',
        obtenerDependencias: () => Promise.resolve([{ etiqueta: 'movimientos', cantidad: 3 }]),
      },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 0))
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('También se eliminarán: 3 movimientos.')

    const botonConfirmar = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button'),
    ).find((boton) => boton.textContent?.trim() === 'Eliminar')
    botonConfirmar?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirmar')).toEqual([[true]])
    wrapper.unmount()
  })

  it('"Ver detalles" muestra el número de registros de la tabla', async () => {
    const wrapper = mount(DialogoConfirmarEliminacion, {
      props: {
        descripcion: 'la cuenta ES00 1234',
        obtenerDependencias: () => Promise.resolve([{ etiqueta: 'movimientos', cantidad: 2 }]),
        tituloDetalles: 'Movimientos que se eliminarán',
        columnasDetalles: ['Fecha', 'Importe'],
        obtenerFilasDetalles: () =>
          Promise.resolve([
            ['01/01/2026', '-10,00 €'],
            ['02/01/2026', '-20,00 €'],
          ]),
      },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 0))
    await wrapper.vm.$nextTick()

    const botonVerDetalles = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button'),
    ).find((boton) => boton.textContent?.trim() === 'Ver detalles')
    botonVerDetalles?.click()
    await new Promise((resolver) => setTimeout(resolver, 0))
    await wrapper.vm.$nextTick()

    const modal = document.body.querySelector('[role="dialog"]')
    expect(modal?.textContent).toContain('2 registros')
    wrapper.unmount()
  })
})
