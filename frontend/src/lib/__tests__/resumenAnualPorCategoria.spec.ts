import { describe, expect, it } from 'vitest'
import type { FilaResumenAnual, ValorMensual } from '@/api/tipos'
import {
  agruparFilasResumenAnualPorCategoria,
  sumarTotalesPorMes,
} from '../resumenAnualPorCategoria'

function crearValores(importePorMes: Partial<Record<number, string>> = {}): ValorMensual[] {
  return Array.from({ length: 12 }, (_, indice) => {
    const mes = indice + 1
    return { mes, importe: importePorMes[mes] ?? '0.00', origen: 'previsto' as const }
  })
}

function crearFila(datos: Partial<FilaResumenAnual> = {}): FilaResumenAnual {
  return {
    concepto_id: 1,
    categoria_id: 1,
    subcategoria_id: null,
    nombre: 'Concepto',
    periodicidad: 'mensual',
    valores: crearValores(),
    ...datos,
  }
}

const nombreCategoria = (id: number): string => `Cat ${id}`

describe('sumarTotalesPorMes', () => {
  it('suma el importe de cada mes a través de todas las filas dadas', () => {
    const filas = [
      crearFila({ concepto_id: 1, valores: crearValores({ 1: '-10.00', 2: '-5.00' }) }),
      crearFila({ concepto_id: 2, valores: crearValores({ 1: '-2.50', 3: '100.00' }) }),
    ]

    const totales = sumarTotalesPorMes(filas)

    expect(totales).toHaveLength(12)
    expect(totales[0]).toBe('-12.50')
    expect(totales[1]).toBe('-5.00')
    expect(totales[2]).toBe('100.00')
    expect(totales[3]).toBe('0.00')
  })

  it('sin filas devuelve 12 ceros', () => {
    expect(sumarTotalesPorMes([])).toEqual(Array(12).fill('0.00'))
  })
})

describe('agruparFilasResumenAnualPorCategoria', () => {
  it('agrupa las filas por categoria_id', () => {
    const filas = [
      crearFila({ concepto_id: 1, categoria_id: 10 }),
      crearFila({ concepto_id: 2, categoria_id: 20 }),
      crearFila({ concepto_id: 3, categoria_id: 10 }),
    ]

    const grupos = agruparFilasResumenAnualPorCategoria(filas, nombreCategoria)

    expect(grupos).toHaveLength(2)
    const grupo10 = grupos.find((g) => g.categoriaId === 10)!
    expect(grupo10.nombre).toBe('Cat 10')
    expect(grupo10.filas).toHaveLength(2)
    const grupo20 = grupos.find((g) => g.categoriaId === 20)!
    expect(grupo20.filas).toHaveLength(1)
  })

  it('calcula totalesPorMes y totalAnual sumando las filas del grupo', () => {
    const filas = [
      crearFila({ concepto_id: 1, categoria_id: 1, valores: crearValores({ 1: '-10.00' }) }),
      crearFila({
        concepto_id: 2,
        categoria_id: 1,
        valores: crearValores({ 1: '-5.00', 2: '20.00' }),
      }),
    ]

    const grupos = agruparFilasResumenAnualPorCategoria(filas, nombreCategoria)

    expect(grupos[0]!.totalesPorMes[0]).toBe('-15.00')
    expect(grupos[0]!.totalesPorMes[1]).toBe('20.00')
    expect(grupos[0]!.totalAnual).toBe('5.00')
  })

  it('ordena categorías y filas dentro de cada categoría alfabéticamente por nombre', () => {
    const nombrePorId: Record<number, string> = { 1: 'Zeta', 2: 'Alfa' }
    const filas = [
      crearFila({ concepto_id: 1, categoria_id: 1, nombre: 'Zapato' }),
      crearFila({ concepto_id: 2, categoria_id: 1, nombre: 'Agua' }),
      crearFila({ concepto_id: 3, categoria_id: 2 }),
    ]

    const grupos = agruparFilasResumenAnualPorCategoria(filas, (id) => nombrePorId[id]!)

    expect(grupos.map((g) => g.nombre)).toEqual(['Alfa', 'Zeta'])
    const grupoZeta = grupos.find((g) => g.nombre === 'Zeta')!
    expect(grupoZeta.filas.map((f) => f.nombre)).toEqual(['Agua', 'Zapato'])
  })

  it('sin filas devuelve un array vacío', () => {
    expect(agruparFilasResumenAnualPorCategoria([], nombreCategoria)).toEqual([])
  })
})
