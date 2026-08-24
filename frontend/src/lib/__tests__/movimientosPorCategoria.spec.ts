import { describe, expect, it } from 'vitest'
import type { Movimiento } from '@/api/tipos'
import { agruparMovimientosPorCategoria } from '../movimientosPorCategoria'

function crearMovimiento(datos: Partial<Movimiento>): Movimiento {
  return {
    id: 1,
    cuenta_id: 1,
    categoria_id: 1,
    subcategoria_id: null,
    fecha_valor: '2026-01-01',
    descripcion: 'Movimiento',
    comentario: null,
    importe: '0',
    saldo: '0',
    ...datos,
  }
}

const resolverSubcategoria = (id: number | null): string => (id === null ? '' : `Sub ${id}`)

describe('agruparMovimientosPorCategoria', () => {
  it('agrupa los movimientos por categoria_id', () => {
    const movimientos = [
      crearMovimiento({ id: 1, categoria_id: 10, importe: '-10' }),
      crearMovimiento({ id: 2, categoria_id: 20, importe: '-20' }),
      crearMovimiento({ id: 3, categoria_id: 10, importe: '-5' }),
    ]

    const resultado = agruparMovimientosPorCategoria(movimientos, resolverSubcategoria)

    expect(Object.keys(resultado)).toEqual(['10', '20'])
    expect(resultado[10]).toHaveLength(2)
    expect(resultado[20]).toHaveLength(1)
  })

  it('ordena cada grupo de mayor a menor importe en valor absoluto', () => {
    const movimientos = [
      crearMovimiento({ id: 1, categoria_id: 10, descripcion: 'Pequeño', importe: '-5' }),
      crearMovimiento({ id: 2, categoria_id: 10, descripcion: 'Grande', importe: '-50' }),
      crearMovimiento({ id: 3, categoria_id: 10, descripcion: 'Mediano', importe: '20' }),
    ]

    const resultado = agruparMovimientosPorCategoria(movimientos, resolverSubcategoria)

    expect((resultado[10] ?? []).map((m) => m.descripcion)).toEqual([
      'Grande',
      'Mediano',
      'Pequeño',
    ])
  })

  it('mapea cada movimiento a fecha/descripcion/subcategoria/importe usando el resolutor dado', () => {
    const movimientos = [
      crearMovimiento({
        categoria_id: 10,
        subcategoria_id: 42,
        fecha_valor: '2026-03-15',
        descripcion: 'Pago en tienda',
        importe: '-15.50',
      }),
    ]

    const resultado = agruparMovimientosPorCategoria(movimientos, resolverSubcategoria)

    expect(resultado[10]).toEqual([
      {
        fecha: '2026-03-15',
        descripcion: 'Pago en tienda',
        subcategoria: 'Sub 42',
        importe: '-15.50',
      },
    ])
  })

  it('sin movimientos devuelve un objeto vacío', () => {
    expect(agruparMovimientosPorCategoria([], resolverSubcategoria)).toEqual({})
  })
})
