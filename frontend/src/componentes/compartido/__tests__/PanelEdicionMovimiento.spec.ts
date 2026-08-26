import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
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

describe('PanelEdicionMovimiento', () => {
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
})
