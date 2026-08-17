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

  it('confirmar en el diálogo emite confirmar', async () => {
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

    expect(wrapper.emitted('confirmar')).toHaveLength(1)
    wrapper.unmount()
  })
})
