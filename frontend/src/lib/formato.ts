const formateadorImporte = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

export function formatearImporte(importe: string | number): string {
  return formateadorImporte.format(Number(importe))
}

/** Clases de color para un importe: verde si es positivo, rojo si es negativo, ninguna si es cero. */
export function claseColorImporte(importe: string | number): string {
  const valor = Number(importe)
  if (valor > 0) return 'text-success dark:text-emerald-500'
  if (valor < 0) return 'text-destructive'
  return ''
}

/**
 * Fondo suave para teñir la fila entera de un registro según el signo de su
 * importe (el texto de la celda Importe se deja sin colorear: combinar texto
 * y fondo del mismo tono no llega al contraste WCAG AA de 4.5:1 exigido por
 * los tests de accesibilidad de este proyecto — el fondo ya es señal
 * suficiente). Lleva "!" (!important) porque TableBody ya aplica su propio
 * rayado de cebra en las filas pares (`[&_tr:nth-child(even)]:bg-muted/30`),
 * cuyo selector compuesto tiene más especificidad CSS que una clase simple y
 * lo sobrescribiría en la mitad de las filas si no se fuerza aquí.
 */
export function claseFondoImporte(importe: string | number): string {
  const valor = Number(importe)
  if (valor > 0) return '!bg-success/10'
  if (valor < 0) return '!bg-destructive/10'
  return ''
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
