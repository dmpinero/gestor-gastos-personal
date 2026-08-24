import type { Movimiento } from '@/api/tipos'
import type { MovimientoDeCategoria } from '@/componentes/dashboard/ListaTotalesCategoria.vue'

/**
 * Agrupa movimientos por categoría, ordenados de mayor a menor importe (en
 * valor absoluto) dentro de cada grupo. Alimenta el tooltip y la modal
 * "Detalles" de cada categoría en ListaTotalesCategoria.
 */
export function agruparMovimientosPorCategoria(
  movimientos: Movimiento[],
  resolverSubcategoria: (idSubcategoria: number | null) => string,
): Record<number, MovimientoDeCategoria[]> {
  const porCategoria = new Map<number, Movimiento[]>()
  for (const m of movimientos) {
    const lista = porCategoria.get(m.categoria_id) ?? []
    lista.push(m)
    porCategoria.set(m.categoria_id, lista)
  }

  const resultado: Record<number, MovimientoDeCategoria[]> = {}
  for (const [idCategoria, lista] of porCategoria) {
    resultado[idCategoria] = [...lista]
      .sort((a, b) => Math.abs(Number(b.importe)) - Math.abs(Number(a.importe)))
      .map((m) => ({
        fecha: m.fecha_valor,
        descripcion: m.descripcion,
        subcategoria: resolverSubcategoria(m.subcategoria_id),
        importe: m.importe,
      }))
  }
  return resultado
}
