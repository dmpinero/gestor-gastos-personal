import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

// Con el diálogo principal y un mini-panel de creación abiertos a la vez
// puede haber varios <form> en document.body: se envía el que contiene el
// campo indicado, en vez de asumir que es el primero del documento.
async function enviarFormularioDe(idCampo: string): Promise<void> {
  const campo = document.body.querySelector(`#${idCampo}`) as HTMLElement
  const formulario = campo.closest('form') as HTMLFormElement
  formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
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

  it('el botón "+" de Subcategoría está deshabilitado sin categoría elegida', async () => {
    const { wrapper } = montar()

    await wrapper.get('button').trigger('click')
    await nextTick()

    const boton = document.body.querySelector(
      '[aria-label="Crear subcategoría"]',
    ) as HTMLButtonElement
    expect(boton.disabled).toBe(true)
    wrapper.unmount()
  })

  it('crear una categoría desde el botón "+" la deja elegida y limpia la subcategoría previa', async () => {
    const { wrapper } = montar()
    const tiendaCategorias = useTiendaCategorias()
    const espia = vi.spyOn(tiendaCategorias, 'crearCategoria').mockImplementation(async () => {
      const categoria = { id: 300, nombre: 'Transporte' }
      tiendaCategorias.categorias.push({ categoria, subcategorias: [] })
      return categoria
    })

    await wrapper.get('button').trigger('click')
    await nextTick()
    ;(wrapper.vm as unknown as { categoriaTexto: string }).categoriaTexto = '100'
    await nextTick()
    ;(wrapper.vm as unknown as { subcategoriaTexto: string }).subcategoriaTexto = '1000'
    await nextTick()
    ;(document.body.querySelector('[aria-label="Crear categoría"]') as HTMLButtonElement).click()
    await nextTick()

    const titulos = document.body.querySelectorAll('[data-slot="sheet-title"]')
    expect(titulos[titulos.length - 1]?.textContent).toBe('Crear categoría')
    const campoNombre = document.body.querySelector(
      '#nombre-nueva-categoria-masiva',
    ) as HTMLInputElement
    campoNombre.value = 'Transporte'
    campoNombre.dispatchEvent(new Event('input'))
    await nextTick()
    await enviarFormularioDe('nombre-nueva-categoria-masiva')

    expect(espia).toHaveBeenCalledWith('Transporte')
    expect(
      (document.body.querySelector('#selector-categoria-masiva') as HTMLInputElement).value,
    ).toContain('Transporte')
    expect(
      (document.body.querySelector('#selector-subcategoria-masiva') as HTMLInputElement).value,
    ).not.toContain('Cine')
    botonPorTexto('Aplicar')?.click()
    await nextTick()
    expect(wrapper.emitted('confirmar')).toEqual([[300, null]])
    wrapper.unmount()
  })

  it('crear una subcategoría desde el botón "+" la deja elegida', async () => {
    const { wrapper } = montar()
    const tiendaCategorias = useTiendaCategorias()
    const espia = vi.spyOn(tiendaCategorias, 'crearSubcategoria').mockImplementation(async () => {
      const subcategoria = { id: 1001, nombre: 'Teatro', categoria_id: 100 }
      tiendaCategorias.categorias[0]!.subcategorias.push(subcategoria)
      return subcategoria
    })

    await wrapper.get('button').trigger('click')
    await nextTick()
    ;(wrapper.vm as unknown as { categoriaTexto: string }).categoriaTexto = '100'
    await nextTick()
    ;(document.body.querySelector('[aria-label="Crear subcategoría"]') as HTMLButtonElement).click()
    await nextTick()

    const campoNombre = document.body.querySelector(
      '#nombre-nueva-subcategoria-masiva',
    ) as HTMLInputElement
    campoNombre.value = 'Teatro'
    campoNombre.dispatchEvent(new Event('input'))
    await nextTick()
    await enviarFormularioDe('nombre-nueva-subcategoria-masiva')

    expect(espia).toHaveBeenCalledWith(100, 'Teatro')
    expect(
      (document.body.querySelector('#selector-subcategoria-masiva') as HTMLInputElement).value,
    ).toContain('Teatro')
    botonPorTexto('Aplicar')?.click()
    await nextTick()
    expect(wrapper.emitted('confirmar')).toEqual([[100, 1001]])
    wrapper.unmount()
  })

  it('un error al crear una categoría se muestra con role="alert" dentro del mini-panel sin cerrarlo', async () => {
    const { wrapper } = montar()
    const tiendaCategorias = useTiendaCategorias()
    vi.spyOn(tiendaCategorias, 'crearCategoria').mockRejectedValue(new Error('nombre repetido'))

    await wrapper.get('button').trigger('click')
    await nextTick()
    ;(document.body.querySelector('[aria-label="Crear categoría"]') as HTMLButtonElement).click()
    await nextTick()

    const campoNombre = document.body.querySelector(
      '#nombre-nueva-categoria-masiva',
    ) as HTMLInputElement
    campoNombre.value = 'Ocio'
    campoNombre.dispatchEvent(new Event('input'))
    await nextTick()
    await enviarFormularioDe('nombre-nueva-categoria-masiva')

    expect(document.body.querySelector('[role="alert"]')?.textContent).toBe('nombre repetido')
    expect(document.body.querySelector('#nombre-nueva-categoria-masiva')).not.toBeNull()
    wrapper.unmount()
  })
})
