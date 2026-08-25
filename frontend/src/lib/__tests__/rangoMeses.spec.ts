import { describe, expect, it } from 'vitest'
import { detectarMesCompleto, rangoDelMes } from '../rangoMeses'

describe('detectarMesCompleto', () => {
  it('detecta un mes completo (día 1 al último día del mes)', () => {
    expect(detectarMesCompleto('2026-02-01', '2026-02-28')).toEqual({ anio: 2026, mes: 2 })
  })

  it('detecta correctamente el último día en un mes de 31 días y en año bisiesto', () => {
    expect(detectarMesCompleto('2026-01-01', '2026-01-31')).toEqual({ anio: 2026, mes: 1 })
    // 2028 es bisiesto: febrero tiene 29 días.
    expect(detectarMesCompleto('2028-02-01', '2028-02-29')).toEqual({ anio: 2028, mes: 2 })
  })

  it('devuelve null si falta alguna de las dos fechas', () => {
    expect(detectarMesCompleto('', '2026-02-28')).toBeNull()
    expect(detectarMesCompleto('2026-02-01', '')).toBeNull()
    expect(detectarMesCompleto('', '')).toBeNull()
  })

  it('devuelve null si el rango no empieza el día 1', () => {
    expect(detectarMesCompleto('2026-02-02', '2026-02-28')).toBeNull()
  })

  it('devuelve null si el rango no termina el último día del mes', () => {
    expect(detectarMesCompleto('2026-02-01', '2026-02-27')).toBeNull()
  })

  it('devuelve null si desde y hasta caen en meses distintos', () => {
    expect(detectarMesCompleto('2026-01-01', '2026-02-28')).toBeNull()
  })

  it('devuelve null si desde y hasta caen en años distintos', () => {
    expect(detectarMesCompleto('2025-02-01', '2026-02-28')).toBeNull()
  })
})

describe('rangoDelMes', () => {
  it('calcula el primer y último día de un mes normal', () => {
    expect(rangoDelMes(2026, 3)).toEqual({ desde: '2026-03-01', hasta: '2026-03-31' })
  })

  it('mes=0 retrocede a diciembre del año anterior', () => {
    expect(rangoDelMes(2026, 0)).toEqual({ desde: '2025-12-01', hasta: '2025-12-31' })
  })

  it('mes=13 avanza a enero del año siguiente', () => {
    expect(rangoDelMes(2026, 13)).toEqual({ desde: '2027-01-01', hasta: '2027-01-31' })
  })
})
