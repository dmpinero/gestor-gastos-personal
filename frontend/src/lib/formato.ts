const formateadorImporte = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

export function formatearImporte(importe: string | number): string {
  return formateadorImporte.format(Number(importe))
}

export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

const formateadorPeriodo = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' })

/** Convierte un periodo "AAAA-MM" en una etiqueta legible, p. ej. "ene 2026". */
export function formatearPeriodo(periodo: string): string {
  const anio = Number(periodo.slice(0, 4))
  const mes = Number(periodo.slice(5, 7))
  return formateadorPeriodo.format(new Date(anio, mes - 1, 1))
}
