import { describe, expect, it } from 'vitest'
import { formatearFecha, formatearImporte } from '../formato'

describe('formatearFecha', () => {
  it('convierte una fecha ISO a formato dd/mm/aaaa', () => {
    expect(formatearFecha('2026-01-05')).toBe('05/01/2026')
  })

  it('conserva ceros a la izquierda de día y mes', () => {
    expect(formatearFecha('2026-12-31')).toBe('31/12/2026')
  })
})

describe('formatearImporte', () => {
  it('formatea un importe positivo con el símbolo € al final', () => {
    expect(formatearImporte('1500.00')).toContain('1500,00')
    expect(formatearImporte('1500.00')).toContain('€')
  })

  it('formatea un importe negativo conservando el signo', () => {
    expect(formatearImporte('-30.00')).toContain('-30,00')
  })
})
