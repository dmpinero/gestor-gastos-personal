import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import type { DuplicadoDetectado } from '@/api/tipos'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaMovimientos } from '@/stores/movimientos'
import ModalComparacionDuplicados from '../ModalComparacionDuplicados.vue'

const DUPLICADO: DuplicadoDetectado = {
  fila_excel: {
    fecha_valor: '2026-01-05',
    categoria: 'Alimentación',
    subcategoria: 'Supermercado',
    descripcion: 'Compra en Mercadona',
    comentario: null,
    importe: '-45.00',
    saldo: '1000.00',
  },
  movimiento_existente: {
    id: 99,
    cuenta_id: 1,
    categoria_id: 1,
    subcategoria_id: 10,
    fecha_valor: '2026-01-05',
    descripcion: 'Compra en Mercadona',
    comentario: null,
    importe: '-45.00',
    saldo: '1000.00',
  },
}

function montar(duplicados: DuplicadoDetectado[]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const tiendaCategorias = useTiendaCategorias()
  tiendaCategorias.categorias = [
    {
      categoria: { id: 1, nombre: 'Alimentación' },
      subcategorias: [{ id: 10, nombre: 'Supermercado', categoria_id: 1 }],
    },
  ]

  return mount(ModalComparacionDuplicados, {
    attachTo: document.body,
    global: { plugins: [pinia] },
    props: { nombreFichero: 'movimientos.xlsx', duplicados },
  })
}

describe('ModalComparacionDuplicados', () => {
  it('el botón indica cuántos duplicados hay', () => {
    const wrapper = montar([DUPLICADO, DUPLICADO])
    expect(wrapper.get('button').text()).toBe('Ver duplicados (2)')
    wrapper.unmount()
  })

  it('al abrir, compara la fila del Excel con el movimiento ya existente resolviendo categoría/subcategoría por id', async () => {
    const wrapper = montar([DUPLICADO])

    await wrapper.get('button').trigger('click')

    const modal = document.body.querySelector('[role="dialog"]')
    expect(modal?.textContent).toContain('movimientos.xlsx')
    expect(modal?.textContent).toContain('Este fichero')
    expect(modal?.textContent).toContain('Ya existía')
    // La fecha, la descripción y el importe aparecen dos veces (una por fila).
    expect(modal?.textContent?.match(/05\/01\/2026/g)).toHaveLength(2)
    expect(modal?.textContent?.match(/Compra en Mercadona/g)).toHaveLength(2)
    // La categoría/subcategoría del movimiento existente se resuelve desde la
    // tienda por id, y coincide con la de la fila del Excel (viene como texto).
    expect(modal?.textContent?.match(/Alimentación/g)).toHaveLength(2)
    expect(modal?.textContent?.match(/Supermercado/g)).toHaveLength(2)

    wrapper.unmount()
  })

  it('con un movimiento existente sin subcategoría, la celda queda vacía en vez de mostrar un error', async () => {
    const duplicadoSinSubcategoria: DuplicadoDetectado = {
      ...DUPLICADO,
      movimiento_existente: { ...DUPLICADO.movimiento_existente, subcategoria_id: null },
    }
    const wrapper = montar([duplicadoSinSubcategoria])

    await wrapper.get('button').trigger('click')

    const modal = document.body.querySelector('[role="dialog"]')
    // Solo aparece una vez: la de la fila del Excel ("Supermercado"); la fila
    // "Ya existía" queda vacía porque subcategoria_id es null.
    expect(modal?.textContent?.match(/Supermercado/g)).toHaveLength(1)

    wrapper.unmount()
  })

  it('editar el movimiento "Ya existía" actualiza esa fila en la propia modal, sin tocar "Este fichero"', async () => {
    const wrapper = montar([DUPLICADO])
    await wrapper.get('button').trigger('click')

    const tiendaMovimientos = useTiendaMovimientos()
    vi.spyOn(tiendaMovimientos, 'actualizar').mockResolvedValue({
      ...DUPLICADO.movimiento_existente,
      descripcion: 'Compra en Mercadona (corregida)',
    })

    const botonesEditar = document.body.querySelectorAll('tbody button[aria-label="Editar"]')
    expect(botonesEditar).toHaveLength(1) // solo la fila "Ya existía" es editable
    ;(botonesEditar[0] as HTMLButtonElement).click()
    await nextTick()

    expect(document.body.querySelector('[data-slot="sheet-title"]')?.textContent).toBe(
      'Editar movimiento',
    )

    const formulario = document.body.querySelector('form') as HTMLFormElement
    formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()

    const modal = document.body.querySelector('[role="dialog"]')
    expect(modal?.textContent).toContain('Compra en Mercadona (corregida)')
    // "Este fichero" sigue mostrando el texto original de la fila del Excel.
    expect(modal?.textContent?.match(/Compra en Mercadona(?! \(corregida\))/g)).toHaveLength(1)
    wrapper.unmount()
  })
})
