import { computed, ref, watch, type Ref } from 'vue'

export type TamanoPagina = 10 | 20 | 50 | 'todas'

export function usePaginacionTabla<T>(filas: Ref<T[]>, tamanoPagina: Ref<TamanoPagina>) {
  const paginaActual = ref(1)

  const totalRegistros = computed(() => filas.value.length)

  const totalPaginas = computed(() =>
    tamanoPagina.value === 'todas'
      ? 1
      : Math.max(1, Math.ceil(totalRegistros.value / tamanoPagina.value)),
  )

  const filasPagina = computed(() => {
    if (tamanoPagina.value === 'todas') return filas.value
    const inicio = (paginaActual.value - 1) * tamanoPagina.value
    return filas.value.slice(inicio, inicio + tamanoPagina.value)
  })

  const primerIndice = computed(() => {
    if (filasPagina.value.length === 0) return 0
    return (
      (paginaActual.value - 1) *
        (tamanoPagina.value === 'todas' ? totalRegistros.value : tamanoPagina.value) +
      1
    )
  })

  const ultimoIndice = computed(() =>
    primerIndice.value === 0 ? 0 : primerIndice.value - 1 + filasPagina.value.length,
  )

  // Cambiar el tamaño de página es una acción explícita del usuario: se
  // vuelve a la página 1. En cambio, un cambio en `filas` (búsqueda, orden,
  // alta/baja de registros) NO reinicia la página automáticamente — las
  // altas deben poder llevar a la última página (donde aparece el nuevo
  // registro) y las búsquedas gestionan su propio reinicio en la vista, para
  // no pisar esa navegación explícita. Si la página actual queda fuera de
  // rango (p. ej. al buscar o al eliminar el último registro de la última
  // página), se ajusta al último valor válido.
  watch(tamanoPagina, () => {
    paginaActual.value = 1
  })
  watch(totalPaginas, (nuevoTotal) => {
    if (paginaActual.value > nuevoTotal) paginaActual.value = nuevoTotal
  })

  function paginaSiguiente(): void {
    if (paginaActual.value < totalPaginas.value) paginaActual.value++
  }

  function paginaAnterior(): void {
    if (paginaActual.value > 1) paginaActual.value--
  }

  return {
    paginaActual,
    totalPaginas,
    filasPagina,
    totalRegistros,
    primerIndice,
    ultimoIndice,
    paginaSiguiente,
    paginaAnterior,
  }
}
