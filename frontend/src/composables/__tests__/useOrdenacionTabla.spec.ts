import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useOrdenacionTabla } from '../useOrdenacionTabla'

interface Fila {
  nombre: string
  importe: number
}

const filas = [
  { nombre: 'Beta', importe: 20 },
  { nombre: 'Alfa', importe: 30 },
  { nombre: 'Gamma', importe: 10 },
]

const comparadores = {
  nombre: (a: Fila, b: Fila) => a.nombre.localeCompare(b.nombre),
  importe: (a: Fila, b: Fila) => a.importe - b.importe,
}

describe('useOrdenacionTabla', () => {
  it('sin campo de orden devuelve las filas tal cual', () => {
    const { filasOrdenadas } = useOrdenacionTabla(ref(filas), comparadores)

    expect(filasOrdenadas.value).toEqual(filas)
  })

  it('ordena ascendentemente al elegir un campo', () => {
    const { ordenarPor, filasOrdenadas } = useOrdenacionTabla(ref(filas), comparadores)

    ordenarPor('nombre')

    expect(filasOrdenadas.value.map((f) => f.nombre)).toEqual(['Alfa', 'Beta', 'Gamma'])
  })

  it('pulsar el mismo campo dos veces invierte la dirección', () => {
    const { ordenarPor, filasOrdenadas, direccion } = useOrdenacionTabla(ref(filas), comparadores)

    ordenarPor('importe')
    ordenarPor('importe')

    expect(direccion.value).toBe('desc')
    expect(filasOrdenadas.value.map((f) => f.importe)).toEqual([30, 20, 10])
  })

  it('cambiar de campo reinicia la dirección a ascendente', () => {
    const { ordenarPor, direccion } = useOrdenacionTabla(ref(filas), comparadores)

    ordenarPor('importe')
    ordenarPor('importe')
    ordenarPor('nombre')

    expect(direccion.value).toBe('asc')
  })

  it('no muta el array original', () => {
    const original = ref([...filas])
    const { ordenarPor, filasOrdenadas } = useOrdenacionTabla(original, comparadores)

    ordenarPor('nombre')

    expect(filasOrdenadas.value).not.toBe(original.value)
    expect(original.value.map((f) => f.nombre)).toEqual(['Beta', 'Alfa', 'Gamma'])
  })
})
