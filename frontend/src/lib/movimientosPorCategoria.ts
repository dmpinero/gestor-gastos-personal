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
        id: m.id,
        cuenta_id: m.cuenta_id,
        categoria_id: m.categoria_id,
        subcategoria_id: m.subcategoria_id,
        fecha: m.fecha_valor,
        descripcion: m.descripcion,
        comentario: m.comentario,
        subcategoria: resolverSubcategoria(m.subcategoria_id),
        importe: m.importe,
        saldo: m.saldo,
      }))
  }
  return resultado
}

const SIN_SUBCATEGORIA = -1

export interface GrupoMovimientosSubcategoria {
  subcategoriaId: number | null
  nombre: string
  totalGastado: number
  totalIngresado: number
  movimientos: Movimiento[]
}

export interface GrupoMovimientosCategoria {
  categoriaId: number
  nombre: string
  totalGastado: number
  totalIngresado: number
  numMovimientos: number
  subcategorias: GrupoMovimientosSubcategoria[]
}

/**
 * Agrupa movimientos por categoría y, dentro de cada categoría, por
 * subcategoría (bucket "(sin subcategoría)" para subcategoria_id null),
 * calculando el total de gastos y de ingresos por separado en cada nivel
 * (nunca neteados, siguiendo la convención del resto de la app). Alimenta
 * TablaMovimientosAgrupada.vue. Categorías y subcategorías se ordenan
 * alfabéticamente; los movimientos de cada subcategoría, por fecha
 * descendente.
 */
export function agruparMovimientosParaTabla(
  movimientos: Movimiento[],
  nombreCategoria: (idCategoria: number) => string,
  nombreSubcategoria: (idSubcategoria: number | null) => string,
): GrupoMovimientosCategoria[] {
  const porCategoria = new Map<number, Map<number, Movimiento[]>>()
  for (const m of movimientos) {
    const subcategorias = porCategoria.get(m.categoria_id) ?? new Map<number, Movimiento[]>()
    porCategoria.set(m.categoria_id, subcategorias)
    const claveSubcategoria = m.subcategoria_id ?? SIN_SUBCATEGORIA
    const lista = subcategorias.get(claveSubcategoria) ?? []
    lista.push(m)
    subcategorias.set(claveSubcategoria, lista)
  }

  function sumar(lista: Movimiento[], predicado: (importe: number) => boolean): number {
    return lista
      .map((m) => Number(m.importe))
      .filter(predicado)
      .reduce((suma, importe) => suma + importe, 0)
  }

  const grupos: GrupoMovimientosCategoria[] = [...porCategoria.entries()].map(
    ([categoriaId, subcategoriasMapa]) => {
      const subcategorias: GrupoMovimientosSubcategoria[] = [...subcategoriasMapa.entries()]
        .map(([claveSubcategoria, lista]) => {
          const subcategoriaId = claveSubcategoria === SIN_SUBCATEGORIA ? null : claveSubcategoria
          return {
            subcategoriaId,
            nombre: nombreSubcategoria(subcategoriaId) || '(sin subcategoría)',
            totalGastado: sumar(lista, (importe) => importe < 0),
            totalIngresado: sumar(lista, (importe) => importe > 0),
            movimientos: [...lista].sort((a, b) => b.fecha_valor.localeCompare(a.fecha_valor)),
          }
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre))

      const movimientosDeLaCategoria = subcategorias.flatMap((s) => s.movimientos)
      return {
        categoriaId,
        nombre: nombreCategoria(categoriaId),
        totalGastado: sumar(movimientosDeLaCategoria, (importe) => importe < 0),
        totalIngresado: sumar(movimientosDeLaCategoria, (importe) => importe > 0),
        numMovimientos: movimientosDeLaCategoria.length,
        subcategorias,
      }
    },
  )

  return grupos.sort((a, b) => a.nombre.localeCompare(b.nombre))
}
