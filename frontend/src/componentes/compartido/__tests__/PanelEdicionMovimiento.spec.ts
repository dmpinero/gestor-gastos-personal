import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { Movimiento } from '@/api/tipos'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import { useTiendaMovimientos } from '@/stores/movimientos'
import PanelEdicionMovimiento from '../PanelEdicionMovimiento.vue'

const movimiento: Movimiento = {
  id: 7,
  cuenta_id: 10,
  categoria_id: 100,
  subcategoria_id: 1000,
  fecha_valor: '2026-01-05',
  descripcion: 'Compra',
  comentario: 'nota',
  importe: '-5.00',
  saldo: '95.00',
}

function montar() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const tiendaCuentas = useTiendaCuentas()
  tiendaCuentas.cuentas = [
    {
      id: 10,
      numero_cuenta: 'ES00 1111',
      alias: 'Nómina',
      entidad_bancaria: null,
      moneda: 'EUR',
      titular: null,
    },
  ]
  const tiendaCategorias = useTiendaCategorias()
  tiendaCategorias.categorias = [
    {
      categoria: { id: 100, nombre: 'Ocio' },
      subcategorias: [{ id: 1000, nombre: 'Cine', categoria_id: 100 }],
    },
  ]
  const tiendaMovimientos = useTiendaMovimientos()
  const wrapper = mount(PanelEdicionMovimiento, {
    attachTo: document.body,
    global: { plugins: [pinia] },
  })
  return { wrapper, tiendaMovimientos }
}

// El Sheet se teletransporta a document.body (DialogPortal), fuera del árbol
// DOM del wrapper: wrapper.find no lo encuentra, así que se envía el submit
// directamente sobre el <form> real, sin pasar por la validación nativa del
// navegador (que sí exigiría los campos "required").
async function enviarFormulario(): Promise<void> {
  const formulario = document.body.querySelector('form') as HTMLFormElement
  formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

// Con el panel principal y un mini-panel de creación abiertos a la vez puede
// haber varios <form> en document.body: se envía el que contiene el campo
// indicado, en vez de asumir que es el primero del documento.
async function enviarFormularioDe(idCampo: string): Promise<void> {
  const campo = document.body.querySelector(`#${idCampo}`) as HTMLElement
  const formulario = campo.closest('form') as HTMLFormElement
  formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

describe('PanelEdicionMovimiento', () => {
  // Los Sheet se montan con attachTo: document.body; si un test falla antes de
  // llegar a wrapper.unmount(), sus nodos quedan y contaminan el resto.
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('abrir para editar precarga el formulario y guardar envía los datos actualizados a la tienda', async () => {
    const { wrapper, tiendaMovimientos } = montar()
    const espia = vi.spyOn(tiendaMovimientos, 'actualizar').mockResolvedValue(movimiento)

    wrapper.vm.abrirParaEditar(movimiento)
    await nextTick()

    expect(document.body.querySelector('[data-slot="sheet-title"]')?.textContent).toBe(
      'Editar movimiento',
    )
    expect((document.body.querySelector('#fecha-valor') as HTMLInputElement).value).toBe(
      '2026-01-05',
    )
    expect((document.body.querySelector('#descripcion') as HTMLInputElement).value).toBe('Compra')
    expect((document.body.querySelector('#comentario') as HTMLInputElement).value).toBe('nota')
    expect((document.body.querySelector('#importe') as HTMLInputElement).value).toBe('-5.00')
    expect((document.body.querySelector('#saldo') as HTMLInputElement).value).toBe('95.00')

    await enviarFormulario()

    expect(espia).toHaveBeenCalledWith(7, {
      cuenta_id: 10,
      categoria_id: 100,
      subcategoria_id: 1000,
      fecha_valor: '2026-01-05',
      descripcion: 'Compra',
      comentario: 'nota',
      importe: '-5.00',
      saldo: '95.00',
    })
    wrapper.unmount()
  })

  it('emite "guardado" con el movimiento devuelto por la tienda tras editar', async () => {
    const { wrapper, tiendaMovimientos } = montar()
    const movimientoActualizado = { ...movimiento, descripcion: 'Compra editada' }
    vi.spyOn(tiendaMovimientos, 'actualizar').mockResolvedValue(movimientoActualizado)

    wrapper.vm.abrirParaEditar(movimiento)
    await nextTick()
    await enviarFormulario()

    expect(wrapper.emitted('guardado')?.[0]).toEqual([movimientoActualizado])
    wrapper.unmount()
  })

  it('abrir para crear reinicia el formulario con la cuenta por defecto indicada', async () => {
    const { wrapper } = montar()
    wrapper.vm.abrirParaEditar(movimiento) // deja el formulario "sucio" antes de crear
    await nextTick()

    wrapper.vm.abrirParaCrear(10)
    await nextTick()

    expect(document.body.querySelector('[data-slot="sheet-title"]')?.textContent).toBe(
      'Crear movimiento',
    )
    expect((document.body.querySelector('#descripcion') as HTMLInputElement).value).toBe('')
    expect((document.body.querySelector('#importe') as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('un error al guardar se muestra con role="alert" y no cierra el panel', async () => {
    const { wrapper, tiendaMovimientos } = montar()
    vi.spyOn(tiendaMovimientos, 'actualizar').mockRejectedValue(new Error('fallo de red'))

    wrapper.vm.abrirParaEditar(movimiento)
    await nextTick()
    await enviarFormulario()

    expect(document.body.querySelector('[role="alert"]')?.textContent).toBe('fallo de red')
    expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('el botón "+" de Subcategoría está deshabilitado sin categoría seleccionada', async () => {
    const { wrapper } = montar()
    wrapper.vm.abrirParaCrear(10)
    await nextTick()

    const boton = document.body.querySelector(
      '[aria-label="Crear subcategoría"]',
    ) as HTMLButtonElement
    expect(boton.disabled).toBe(true)
    wrapper.unmount()
  })

  it('crear una categoría desde el botón "+" la deja seleccionada y limpia la subcategoría previa', async () => {
    const { wrapper } = montar()
    const tiendaCategorias = useTiendaCategorias()
    const espia = vi.spyOn(tiendaCategorias, 'crearCategoria').mockImplementation(async () => {
      const categoria = { id: 200, nombre: 'Salud' }
      tiendaCategorias.categorias.push({ categoria, subcategorias: [] })
      return categoria
    })

    wrapper.vm.abrirParaEditar(movimiento)
    await nextTick()
    ;(document.body.querySelector('[aria-label="Crear categoría"]') as HTMLButtonElement).click()
    await nextTick()

    const titulos = document.body.querySelectorAll('[data-slot="sheet-title"]')
    expect(titulos[titulos.length - 1]?.textContent).toBe('Crear categoría')
    const campoNombre = document.body.querySelector('#nombre-nueva-categoria') as HTMLInputElement
    campoNombre.value = 'Salud'
    campoNombre.dispatchEvent(new Event('input'))
    await nextTick()
    await enviarFormularioDe('nombre-nueva-categoria')

    expect(espia).toHaveBeenCalledWith('Salud')
    expect(document.body.querySelector('#selector-categoria')?.textContent).toContain('Salud')
    expect(document.body.querySelector('#selector-subcategoria')?.textContent).not.toContain('Cine')
    expect(
      document.body.querySelectorAll('[data-slot="sheet-content"][data-state="open"]'),
    ).toHaveLength(1)
    wrapper.unmount()
  })

  it('crear una subcategoría desde el botón "+" la deja seleccionada', async () => {
    const { wrapper } = montar()
    const tiendaCategorias = useTiendaCategorias()
    const espia = vi.spyOn(tiendaCategorias, 'crearSubcategoria').mockImplementation(async () => {
      const subcategoria = { id: 2000, nombre: 'Teatro', categoria_id: 100 }
      tiendaCategorias.categorias[0]!.subcategorias.push(subcategoria)
      return subcategoria
    })

    wrapper.vm.abrirParaEditar(movimiento)
    await nextTick()
    ;(document.body.querySelector('[aria-label="Crear subcategoría"]') as HTMLButtonElement).click()
    await nextTick()

    const campoNombre = document.body.querySelector(
      '#nombre-nueva-subcategoria',
    ) as HTMLInputElement
    campoNombre.value = 'Teatro'
    campoNombre.dispatchEvent(new Event('input'))
    await nextTick()
    await enviarFormularioDe('nombre-nueva-subcategoria')

    expect(espia).toHaveBeenCalledWith(100, 'Teatro')
    expect(document.body.querySelector('#selector-subcategoria')?.textContent).toContain('Teatro')
    expect(
      document.body.querySelectorAll('[data-slot="sheet-content"][data-state="open"]'),
    ).toHaveLength(1)
    wrapper.unmount()
  })

  it('un error al crear una categoría se muestra con role="alert" dentro del mini-panel sin cerrarlo', async () => {
    const { wrapper } = montar()
    const tiendaCategorias = useTiendaCategorias()
    vi.spyOn(tiendaCategorias, 'crearCategoria').mockRejectedValue(new Error('nombre repetido'))

    wrapper.vm.abrirParaEditar(movimiento)
    await nextTick()
    ;(document.body.querySelector('[aria-label="Crear categoría"]') as HTMLButtonElement).click()
    await nextTick()

    const campoNombre = document.body.querySelector('#nombre-nueva-categoria') as HTMLInputElement
    campoNombre.value = 'Ocio'
    campoNombre.dispatchEvent(new Event('input'))
    await nextTick()
    await enviarFormularioDe('nombre-nueva-categoria')

    expect(document.body.querySelector('[role="alert"]')?.textContent).toBe('nombre repetido')
    expect(document.body.querySelector('#nombre-nueva-categoria')).not.toBeNull()
    wrapper.unmount()
  })
})
