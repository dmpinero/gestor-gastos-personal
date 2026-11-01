import type { ProximoEvento } from '@/api/tipos'

export interface GrupoNotificacionesMes {
  periodo: string
  totalGastado: number
  totalIngresado: number
  eventos: ProximoEvento[]
}

/**
 * Agrupa próximos eventos por mes de su fecha prevista (periodo "AAAA-MM"),
 * calculando el total de gastos y de ingresos por separado en cada grupo
 * (nunca neteados, siguiendo la convención del resto de la app). Meses y
 * eventos dentro de cada mes se ordenan cronológicamente ascendente.
 */
export function agruparProximosEventosPorMes(eventos: ProximoEvento[]): GrupoNotificacionesMes[] {
  const porMes = new Map<string, ProximoEvento[]>()
  for (const evento of eventos) {
    const periodo = evento.fecha_prevista.slice(0, 7)
    const lista = porMes.get(periodo) ?? []
    lista.push(evento)
    porMes.set(periodo, lista)
  }

  function sumar(lista: ProximoEvento[], predicado: (importe: number) => boolean): number {
    return lista
      .map((e) => Number(e.importe_estimado))
      .filter(predicado)
      .reduce((suma, importe) => suma + importe, 0)
  }

  const grupos: GrupoNotificacionesMes[] = [...porMes.entries()].map(([periodo, lista]) => ({
    periodo,
    totalGastado: sumar(lista, (importe) => importe < 0),
    totalIngresado: sumar(lista, (importe) => importe > 0),
    eventos: [...lista].sort((a, b) => a.fecha_prevista.localeCompare(b.fecha_prevista)),
  }))

  return grupos.sort((a, b) => a.periodo.localeCompare(b.periodo))
}
