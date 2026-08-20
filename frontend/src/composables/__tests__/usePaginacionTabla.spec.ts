import { nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { usePaginacionTabla } from '../usePaginacionTabla'

function crearFilas(cantidad: number): { id: number }[] {
  return Array.from({ length: cantidad }, (_, i) => ({ id: i + 1 }))
}

describe('usePaginacionTabla', () => {
  it('con tamaño 10 y 25 filas, la primera página muestra las 10 primeras', () => {
    const { filasPagina, totalPaginas, totalRegistros } = usePaginacionTabla(
      ref(crearFilas(25)),
      ref(10),
    )

    expect(filasPagina.value.map((f) => f.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(totalPaginas.value).toBe(3)
    expect(totalRegistros.value).toBe(25)
  })

  it('paginaSiguiente avanza a la página siguiente y respeta el límite', () => {
    const { filasPagina, paginaActual, paginaSiguiente, totalPaginas } = usePaginacionTabla(
      ref(crearFilas(25)),
      ref(10),
    )

    paginaSiguiente()
    expect(paginaActual.value).toBe(2)
    expect(filasPagina.value.map((f) => f.id)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])

    paginaSiguiente()
    paginaSiguiente()
    expect(paginaActual.value).toBe(totalPaginas.value)
    expect(filasPagina.value.map((f) => f.id)).toEqual([21, 22, 23, 24, 25])
  })

  it('paginaAnterior retrocede y no baja de la página 1', () => {
    const { paginaActual, paginaAnterior, paginaSiguiente } = usePaginacionTabla(
      ref(crearFilas(25)),
      ref(10),
    )

    paginaAnterior()
    expect(paginaActual.value).toBe(1)

    paginaSiguiente()
    paginaAnterior()
    expect(paginaActual.value).toBe(1)
  })

  it('con tamaño "todas" hay una sola página con todas las filas', () => {
    const { filasPagina, totalPaginas } = usePaginacionTabla(ref(crearFilas(25)), ref('todas'))

    expect(filasPagina.value).toHaveLength(25)
    expect(totalPaginas.value).toBe(1)
  })

  it('calcula primerIndice y ultimoIndice de la página actual', () => {
    const { primerIndice, ultimoIndice, paginaSiguiente } = usePaginacionTabla(
      ref(crearFilas(25)),
      ref(10),
    )

    expect(primerIndice.value).toBe(1)
    expect(ultimoIndice.value).toBe(10)

    paginaSiguiente()
    paginaSiguiente()
    expect(primerIndice.value).toBe(21)
    expect(ultimoIndice.value).toBe(25)
  })

  it('con cero filas, los índices son 0', () => {
    const { primerIndice, ultimoIndice, totalPaginas } = usePaginacionTabla(ref([]), ref(10))

    expect(primerIndice.value).toBe(0)
    expect(ultimoIndice.value).toBe(0)
    expect(totalPaginas.value).toBe(1)
  })

  it('cambiar el tamaño de página reinicia a la página 1', async () => {
    const tamanoPagina = ref<10 | 20 | 50 | 'todas'>(10)
    const { paginaActual, paginaSiguiente } = usePaginacionTabla(ref(crearFilas(25)), tamanoPagina)
    paginaSiguiente()
    expect(paginaActual.value).toBe(2)

    tamanoPagina.value = 20
    await nextTick()

    expect(paginaActual.value).toBe(1)
  })

  it('añadir filas (p. ej. al crear un registro) NO cambia la página actual', async () => {
    const filas = ref(crearFilas(25))
    const { paginaActual, paginaSiguiente } = usePaginacionTabla(filas, ref(10))
    paginaSiguiente()
    expect(paginaActual.value).toBe(2)

    filas.value = [...filas.value, { id: 26 }]
    await nextTick()

    expect(paginaActual.value).toBe(2)
  })

  it('si al reducirse las filas la página actual queda fuera de rango, se ajusta a la última válida', async () => {
    const filas = ref(crearFilas(25))
    const tamanoPagina = ref<10 | 20 | 50 | 'todas'>(10)
    const { paginaActual, paginaSiguiente, totalPaginas } = usePaginacionTabla(filas, tamanoPagina)
    paginaSiguiente()
    paginaSiguiente()
    expect(paginaActual.value).toBe(3)

    filas.value = crearFilas(3)
    await nextTick()

    expect(totalPaginas.value).toBe(1)
    expect(paginaActual.value).toBe(1)
  })

  it('si la página actual sigue siendo válida tras reducirse las filas, se mantiene', async () => {
    const filas = ref(crearFilas(25))
    const { paginaActual, paginaSiguiente } = usePaginacionTabla(filas, ref(10))
    paginaSiguiente()
    expect(paginaActual.value).toBe(2)

    filas.value = crearFilas(15)
    await nextTick()

    expect(paginaActual.value).toBe(2)
  })
})
