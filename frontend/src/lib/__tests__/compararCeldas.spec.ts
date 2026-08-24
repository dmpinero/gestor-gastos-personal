import { describe, expect, it } from 'vitest'
import { formatearFecha, formatearImporte } from '@/lib/formato'
import { compararCeldas } from '../compararCeldas'

describe('compararCeldas', () => {
  it('compara dos números directamente', () => {
    expect(compararCeldas(1, 2)).toBeLessThan(0)
    expect(compararCeldas(2, 1)).toBeGreaterThan(0)
    expect(compararCeldas(5, 5)).toBe(0)
  })

  it('reconoce fechas dd/mm/aaaa y compara cronológicamente, no como texto', () => {
    const antes = formatearFecha('2026-01-05')
    const despues = formatearFecha('2026-02-01')
    // Como texto, "05/01/2026" > "01/02/2026" (el '5' de "05" gana al '1' de
    // "01"); cronológicamente enero va antes que febrero.
    expect(compararCeldas(antes, despues)).toBeLessThan(0)
    expect(compararCeldas(despues, antes)).toBeGreaterThan(0)
  })

  it('reconoce importes en formato es-ES y compara numéricamente, no como texto', () => {
    const menor = formatearImporte('-100.00')
    const mayor = formatearImporte('-5.00')
    // Como texto, "-100,00 €" < "-5,00 €" (el '1' es menor que el '5');
    // numéricamente -100 es menor que -5.
    expect(compararCeldas(menor, mayor)).toBeLessThan(0)
    expect(compararCeldas(mayor, menor)).toBeGreaterThan(0)
  })

  it('reconoce importes con separador de miles', () => {
    const menor = formatearImporte('999.00')
    const mayor = formatearImporte('1234.00')
    expect(compararCeldas(menor, mayor)).toBeLessThan(0)
  })

  it('sin reconocer fecha ni importe en ambos valores, compara como texto', () => {
    expect(compararCeldas('Alfa', 'Beta')).toBeLessThan(0)
    expect(compararCeldas('Beta', 'Alfa')).toBeGreaterThan(0)
    expect(compararCeldas('Igual', 'Igual')).toBe(0)
  })
})
