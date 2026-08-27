import type { FilaResumenAnual } from '@/api/tipos'

/**
 * Suma, mes a mes, el importe de todas las filas dadas. Se usa tanto para
 * los totales de cada grupo de categoría como para recalcular la fila
 * "Total" cuando el buscador de VistaResumenAnual.vue filtra las filas.
 */
export function sumarTotalesPorMes(filas: FilaResumenAnual[]): string[] {
  return Array.from({ length: 12 }, (_, indice) => {
    const mes = indice + 1
    const suma = filas.reduce((acumulado, fila) => {
      const valor = fila.valores.find((v) => v.mes === mes)
      return acumulado + Number(valor?.importe ?? 0)
    }, 0)
    return suma.toFixed(2)
  })
}

export interface GrupoResumenAnualCategoria {
  categoriaId: number
  nombre: string
  totalesPorMes: string[]
  totalAnual: string
  filas: FilaResumenAnual[]
}

/**
 * Agrupa filas del resumen anual por categoría, ordenadas alfabéticamente
 * (mismo criterio que agruparMovimientosParaTabla en movimientosPorCategoria.ts).
 * Alimenta TablaResumenAnualAgrupada.vue.
 */
export function agruparFilasResumenAnualPorCategoria(
  filas: FilaResumenAnual[],
  nombreCategoria: (idCategoria: number) => string,
): GrupoResumenAnualCategoria[] {
  const porCategoria = new Map<number, FilaResumenAnual[]>()
  for (const fila of filas) {
    const lista = porCategoria.get(fila.categoria_id) ?? []
    lista.push(fila)
    porCategoria.set(fila.categoria_id, lista)
  }

  const grupos: GrupoResumenAnualCategoria[] = [...porCategoria.entries()].map(
    ([categoriaId, lista]) => {
      const totalesPorMes = sumarTotalesPorMes(lista)
      const totalAnual = totalesPorMes
        .reduce((suma, importe) => suma + Number(importe), 0)
        .toFixed(2)
      return {
        categoriaId,
        nombre: nombreCategoria(categoriaId),
        totalesPorMes,
        totalAnual,
        filas: [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }
    },
  )

  return grupos.sort((a, b) => a.nombre.localeCompare(b.nombre))
}
