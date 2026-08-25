export interface MesCompleto {
  anio: number
  mes: number // 1-12
}

export function primerDiaDelMes(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-01`
}

export function ultimoDiaDelMes(anio: number, mes: number): string {
  // El día 0 del mes siguiente es el último día del mes actual.
  const ultimoDia = new Date(anio, mes, 0).getDate()
  return `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
}

// Solo si fechaDesde/fechaHasta delimitan exactamente un mes completo (del
// día 1 al último día) tiene sentido ofrecer "mes anterior"/"mes siguiente":
// con cualquier otro rango (parcial, o que abarque varios meses) no hay un
// único mes "actual" al que aplicar el desplazamiento.
export function detectarMesCompleto(fechaDesde: string, fechaHasta: string): MesCompleto | null {
  if (!fechaDesde || !fechaHasta) return null
  const [anioDesde, mesDesde] = fechaDesde.split('-').map(Number)
  const [anioHasta, mesHasta] = fechaHasta.split('-').map(Number)
  if (anioDesde === undefined || mesDesde === undefined) return null
  if (anioDesde !== anioHasta || mesDesde !== mesHasta) return null
  if (fechaDesde !== primerDiaDelMes(anioDesde, mesDesde)) return null
  if (fechaHasta !== ultimoDiaDelMes(anioDesde, mesDesde)) return null
  return { anio: anioDesde, mes: mesDesde }
}

export function rangoDelMes(anio: number, mes: number): { desde: string; hasta: string } {
  // new Date normaliza mes=0 (diciembre del año anterior) y mes=13 (enero
  // del año siguiente), evitando calcular el cambio de año a mano.
  const fecha = new Date(anio, mes - 1, 1)
  const anioNormalizado = fecha.getFullYear()
  const mesNormalizado = fecha.getMonth() + 1
  return {
    desde: primerDiaDelMes(anioNormalizado, mesNormalizado),
    hasta: ultimoDiaDelMes(anioNormalizado, mesNormalizado),
  }
}
