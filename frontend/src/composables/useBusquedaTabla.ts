import { computed, ref, type Ref } from 'vue'

export function useBusquedaTabla<T>(
  filas: Ref<T[]>,
  extraerTexto: (fila: T) => Array<string | null | undefined>,
) {
  const busqueda = ref('')

  const filasFiltradas = computed(() => {
    const termino = busqueda.value.trim().toLowerCase()
    if (!termino) return filas.value
    return filas.value.filter((fila) =>
      extraerTexto(fila).some((valor) => (valor ?? '').toLowerCase().includes(termino)),
    )
  })

  return { busqueda, filasFiltradas }
}
