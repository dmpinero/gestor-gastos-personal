import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import ModalProgresoBloqueante from '../ModalProgresoBloqueante.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ModalProgresoBloqueante', () => {
  it('con progreso conocido, muestra el título y "N de M <unidad>"', async () => {
    const wrapper = mount(ModalProgresoBloqueante, {
      attachTo: document.body,
      props: {
        titulo: 'Eliminando cuentas',
        etiquetaUnidad: 'cuentas',
        progreso: { procesadas: 3, total: 12 },
      },
    })
    await nextTick()

    const modal = document.body.querySelector('[role="dialog"]')
    expect(modal?.textContent).toContain('Eliminando cuentas')
    expect(modal?.textContent).toContain('3 de 12 cuentas')
    wrapper.unmount()
  })

  it('sin progreso todavía (null), muestra "Preparando…"', async () => {
    const wrapper = mount(ModalProgresoBloqueante, {
      attachTo: document.body,
      props: {
        titulo: 'Importando movimientos.xlsx',
        etiquetaUnidad: 'filas',
        progreso: null,
      },
    })
    await nextTick()

    const modal = document.body.querySelector('[role="dialog"]')
    expect(modal?.textContent).toContain('Preparando…')
    wrapper.unmount()
  })

  it('no tiene botón para cerrarla (ni la X ni ningún otro control de cierre)', async () => {
    const wrapper = mount(ModalProgresoBloqueante, {
      attachTo: document.body,
      props: {
        titulo: 'Eliminando movimientos',
        etiquetaUnidad: 'movimientos',
        progreso: { procesadas: 0, total: 5 },
      },
    })
    await nextTick()

    // El botón de cerrar habitual de una modal lleva un texto oculto
    // "Cerrar" (ver DialogContent.vue); aquí no debe existir ningún botón.
    const modal = document.body.querySelector('[role="dialog"]')
    expect(modal?.querySelector('button')).toBeNull()
    expect(modal?.textContent).not.toContain('Cerrar')
    wrapper.unmount()
  })
})
