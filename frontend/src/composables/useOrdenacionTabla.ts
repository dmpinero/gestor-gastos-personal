import { computed, ref, shallowRef, type Ref } from 'vue'

export type Direccion = 'asc' | 'desc'

export function useOrdenacionTabla<T, C extends string>(
  filas: Ref<T[]>,
  comparadores: Record<C, (a: T, b: T) => number>,
) {
  const campo = shallowRef<C | null>(null)
  const direccion = ref<Direccion>('asc')

  function ordenarPor(nuevoCampo: C): void {
    if (campo.value === nuevoCampo) {
      direccion.value = direccion.value === 'asc' ? 'desc' : 'asc'
    } else {
      campo.value = nuevoCampo
      direccion.value = 'asc'
    }
  }

  const filasOrdenadas = computed(() => {
    const campoActivo = campo.value
    if (campoActivo === null) return filas.value
    const comparador = comparadores[campoActivo as C]
    const signo = direccion.value === 'asc' ? 1 : -1
    return [...filas.value].sort((a, b) => signo * comparador(a, b))
  })

  return { campo, direccion, ordenarPor, filasOrdenadas }
}
