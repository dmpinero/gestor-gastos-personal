const PATRON_FECHA = /^(\d{2})\/(\d{2})\/(\d{4})$/

function comoFecha(texto: string): number | null {
  const coincide = PATRON_FECHA.exec(texto)
  if (!coincide) return null
  const [, dia, mes, anio] = coincide
  return new Date(Number(anio), Number(mes) - 1, Number(dia)).getTime()
}

function comoNumero(texto: string): number | null {
  // Formato es-ES: "." separa miles, "," es el decimal (p. ej. "1.234,56 €").
  const limpio = texto
    .replace(/[€\s ]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  if (limpio === '' || limpio === '-') return null
  const numero = Number(limpio)
  return Number.isNaN(numero) ? null : numero
}

/**
 * Compara dos valores de celda ya formateados para mostrar en pantalla (como
 * los que produce `formatearFecha`/`formatearImporte`), reconociendo fechas
 * "dd/mm/aaaa" e importes en formato es-ES; si no reconoce ninguno de los
 * dos formatos en ambos valores, compara como texto. Pensado para tablas
 * genéricas que reciben filas ya formateadas (p. ej. la modal "Ver
 * detalles" de DialogoConfirmarEliminacion), donde no hay acceso al valor
 * numérico/fecha original.
 */
export function compararCeldas(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b

  const aTexto = String(a)
  const bTexto = String(b)

  const aFecha = comoFecha(aTexto)
  const bFecha = comoFecha(bTexto)
  if (aFecha !== null && bFecha !== null) return aFecha - bFecha

  const aNumero = comoNumero(aTexto)
  const bNumero = comoNumero(bTexto)
  if (aNumero !== null && bNumero !== null) return aNumero - bNumero

  return aTexto.localeCompare(bTexto)
}
