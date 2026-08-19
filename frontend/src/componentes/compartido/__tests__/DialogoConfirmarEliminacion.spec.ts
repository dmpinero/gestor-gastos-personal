import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import DialogoConfirmarEliminacion from '../DialogoConfirmarEliminacion.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('DialogoConfirmarEliminacion', () => {
  it('cancelar no emite confirmar', async () => {
    const wrapper = mount(DialogoConfirmarEliminacion, {
      props: { descripcion: 'la cuenta ES00 1234' },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    const botonCancelar = document.body.querySelector<HTMLButtonElement>(
      '[role="alertdialog"] button:not([data-slot="alert-dialog-action"])',
    )
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
})
