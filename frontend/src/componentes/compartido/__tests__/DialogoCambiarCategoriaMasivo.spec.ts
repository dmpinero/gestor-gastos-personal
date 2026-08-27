import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useTiendaCategorias } from '@/stores/categorias'
import DialogoCambiarCategoriaMasivo from '../DialogoCambiarCategoriaMasivo.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

function montar(cantidad = 3) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const tiendaCategorias = useTiendaCategorias()
  tiendaCategorias.categorias = [
    {
      categoria: { id: 100, nombre: 'Ocio' },
      subcategorias: [{ id: 1000, nombre: 'Cine', categoria_id: 100 }],
    },
    {
      categoria: { id: 200, nombre: 'Salud' },
      subcategorias: [],
    },
  ]
  const wrapper = mount(DialogoCambiarCategoriaMasivo, {
    attachTo: document.body,
    global: { plugins: [pinia] },
    props: { cantidad },
  })
  return { wrapper }
}

function botonPorTexto(texto: string): HTMLButtonElement | undefined {
  return Array.from(
    document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
  ).find((boton) => boton.textContent?.trim() === texto)
}

describe('DialogoCambiarCategoriaMasivo', () => {
  it('el título del diálogo usa la cantidad de movimientos seleccionados', async () => {
    const { wrapper } = montar(3)

    await wrapper.get('button').trigger('click')
    await nextTick()

    expect(document.body.textContent).toContain('Cambiar categoría de 3 movimientos seleccionados')
    wrapper.unmount()
  })

  it('el botón Aplicar está deshabilitado mientras no se elija una categoría', async () => {
    const { wrapper } = montar()

    await wrapper.get('button').trigger('click')
    await nextTick()

    expect(botonPorTexto('Aplicar')?.disabled).toBe(true)
    wrapper.unmount()
  })

  it('elegir categoría y subcategoría y confirmar emite "confirmar" con los ids elegidos', async () => {
    const { wrapper } = montar(2)

    await wrapper.get('button').trigger('click')
    await nextTick()

    // El Select de Reka UI no se testea con clicks reales en jsdom (frágil,
    // como en el resto de tests de este proyecto): se fija la elección a
    // través de los proxies expuestos y se comprueba solo el comportamiento
    // observable (botón, evento). La interacción real la cubre el E2E.
    ;(wrapper.vm as unknown as { categoriaTexto: string }).categoriaTexto = '100'
    await nextTick()
    ;(wrapper.vm as unknown as { subcategoriaTexto: string }).subcategoriaTexto = '1000'
    await nextTick()

    expect(botonPorTexto('Aplicar')?.disabled).toBe(false)
    botonPorTexto('Aplicar')?.click()
    await nextTick()

    expect(wrapper.emitted('confirmar')).toEqual([[100, 1000]])
    expect(document.body.querySelector('[role="dialog"]')?.getAttribute('data-state')).toBe(
      'closed',
    )
    wrapper.unmount()
  })

  it('cambiar de categoría después de elegir subcategoría la resetea a "sin subcategoría"', async () => {
    const { wrapper } = montar(1)

    await wrapper.get('button').trigger('click')
    await nextTick()

    const vm = wrapper.vm as unknown as { categoriaTexto: string; subcategoriaTexto: string }
    vm.categoriaTexto = '100'
    await nextTick()
    vm.subcategoriaTexto = '1000'
    await nextTick()
    vm.categoriaTexto = '200'
    await nextTick()

    botonPorTexto('Aplicar')?.click()
    await nextTick()

    expect(wrapper.emitted('confirmar')).toEqual([[200, null]])
    wrapper.unmount()
  })
})
