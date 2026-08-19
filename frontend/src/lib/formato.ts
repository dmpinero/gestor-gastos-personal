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
