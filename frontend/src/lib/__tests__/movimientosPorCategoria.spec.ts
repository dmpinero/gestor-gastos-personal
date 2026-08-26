import { describe, expect, it } from 'vitest'
import type { Movimiento } from '@/api/tipos'
import {
  agruparMovimientosParaTabla,
  agruparMovimientosPorCategoria,
} from '../movimientosPorCategoria'

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
        id: 1,
        cuenta_id: 1,
        categoria_id: 10,
        subcategoria_id: 42,
        fecha: '2026-03-15',
        descripcion: 'Pago en tienda',
        comentario: null,
        subcategoria: 'Sub 42',
        importe: '-15.50',
        saldo: '0',
      },
    ])
  })

  it('sin movimientos devuelve un objeto vacío', () => {
    expect(agruparMovimientosPorCategoria([], resolverSubcategoria)).toEqual({})
  })
})

const nombreCategoria = (id: number): string => `Cat ${id}`

describe('agruparMovimientosParaTabla', () => {
  it('agrupa por categoría y subcategoría, separando totales de gasto e ingreso sin netear', () => {
    const movimientos = [
      crearMovimiento({ categoria_id: 1, subcategoria_id: 10, importe: '-30' }),
      crearMovimiento({ categoria_id: 1, subcategoria_id: 10, importe: '100' }),
      crearMovimiento({ categoria_id: 1, subcategoria_id: 20, importe: '-5' }),
    ]

    const grupos = agruparMovimientosParaTabla(movimientos, nombreCategoria, resolverSubcategoria)

    expect(grupos).toHaveLength(1)
    const categoria = grupos[0]!
    expect(categoria.categoriaId).toBe(1)
    expect(categoria.nombre).toBe('Cat 1')
    expect(categoria.totalGastado).toBe(-35)
    expect(categoria.totalIngresado).toBe(100)
    expect(categoria.numMovimientos).toBe(3)
    expect(categoria.subcategorias).toHaveLength(2)

    const subSub10 = categoria.subcategorias.find((s) => s.subcategoriaId === 10)!
    expect(subSub10.totalGastado).toBe(-30)
    expect(subSub10.totalIngresado).toBe(100)
    const subSub20 = categoria.subcategorias.find((s) => s.subcategoriaId === 20)!
    expect(subSub20.totalGastado).toBe(-5)
    expect(subSub20.totalIngresado).toBe(0)
  })

  it('los movimientos sin subcategoría se agrupan en un bucket "(sin subcategoría)"', () => {
    const movimientos = [
      crearMovimiento({ categoria_id: 1, subcategoria_id: null, importe: '-10' }),
    ]

    const grupos = agruparMovimientosParaTabla(movimientos, nombreCategoria, resolverSubcategoria)

    expect(grupos[0]!.subcategorias).toEqual([
      expect.objectContaining({ subcategoriaId: null, nombre: '(sin subcategoría)' }),
    ])
  })

  it('ordena categorías y subcategorías alfabéticamente por nombre', () => {
    const nombrePorId: Record<number, string> = { 1: 'Zeta', 2: 'Alfa' }
    const movimientos = [
      crearMovimiento({ categoria_id: 1, subcategoria_id: 100 }),
      crearMovimiento({ categoria_id: 2, subcategoria_id: 200 }),
    ]
    const nombreSubPorId: Record<number, string> = { 100: 'Sub Z', 200: 'Sub A' }

    const grupos = agruparMovimientosParaTabla(
      movimientos,
      (id) => nombrePorId[id]!,
      (id) => (id === null ? '' : nombreSubPorId[id]!),
    )

    expect(grupos.map((g) => g.nombre)).toEqual(['Alfa', 'Zeta'])
  })

  it('ordena los movimientos de cada subcategoría por fecha descendente', () => {
    const movimientos = [
      crearMovimiento({ categoria_id: 1, subcategoria_id: 10, fecha_valor: '2026-01-05' }),
      crearMovimiento({ categoria_id: 1, subcategoria_id: 10, fecha_valor: '2026-01-20' }),
      crearMovimiento({ categoria_id: 1, subcategoria_id: 10, fecha_valor: '2026-01-10' }),
    ]

    const grupos = agruparMovimientosParaTabla(movimientos, nombreCategoria, resolverSubcategoria)

    expect(grupos[0]!.subcategorias[0]!.movimientos.map((m) => m.fecha_valor)).toEqual([
      '2026-01-20',
      '2026-01-10',
      '2026-01-05',
    ])
  })

  it('sin movimientos devuelve un array vacío', () => {
    expect(agruparMovimientosParaTabla([], nombreCategoria, resolverSubcategoria)).toEqual([])
  })
})
