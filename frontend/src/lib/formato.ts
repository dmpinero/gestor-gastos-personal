const formateadorImporte = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

export function formatearImporte(importe: string | number): string {
  return formateadorImporte.format(Number(importe))
}
