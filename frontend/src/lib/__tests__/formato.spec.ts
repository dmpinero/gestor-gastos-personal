import { describe, expect, it } from 'vitest'
import {
  claseColorImporte,
  claseFondoImporte,
  formatearFecha,
  formatearImporte,
  formatearMarcaTemporalFichero,
  formatearPeriodo,
} from '../formato'

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

describe('claseColorImporte', () => {
  it('devuelve la clase de verde para un importe positivo', () => {
    expect(claseColorImporte('30.00')).toContain('text-success')
  })

  it('devuelve la clase de rojo para un importe negativo', () => {
    expect(claseColorImporte('-30.00')).toBe('text-destructive')
  })

  it('no devuelve color para un importe igual a cero', () => {
    expect(claseColorImporte('0')).toBe('')
    expect(claseColorImporte(0)).toBe('')
  })
})

describe('claseFondoImporte', () => {
  it('devuelve un fondo verde para un importe positivo', () => {
    expect(claseFondoImporte('30.00')).toBe('!bg-success/10')
  })

  it('devuelve un fondo rojo para un importe negativo', () => {
    expect(claseFondoImporte('-30.00')).toBe('!bg-destructive/10')
  })

  it('no devuelve fondo para un importe igual a cero', () => {
    expect(claseFondoImporte('0')).toBe('')
  })
})

describe('formatearPeriodo', () => {
  it('convierte un periodo AAAA-MM en mes abreviado y año', () => {
    expect(formatearPeriodo('2026-01')).toContain('2026')
    expect(formatearPeriodo('2026-01')).toMatch(/ene/i)
  })

  it('distingue diciembre de enero', () => {
    expect(formatearPeriodo('2026-12')).toMatch(/dic/i)
  })
})

describe('formatearMarcaTemporalFichero', () => {
  it('formatea como ddmmaaaa_hhmmss con ceros a la izquierda', () => {
    const fecha = new Date(2026, 0, 5, 9, 3, 7)
    expect(formatearMarcaTemporalFichero(fecha)).toBe('05012026_090307')
  })

  it('no añade ceros de más cuando día, mes, hora, minuto y segundo tienen 2 dígitos', () => {
    const fecha = new Date(2026, 11, 31, 23, 59, 58)
    expect(formatearMarcaTemporalFichero(fecha)).toBe('31122026_235958')
  })
})
