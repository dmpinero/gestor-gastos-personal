import { ref } from 'vue'

// Instrumenta un lote de tareas asíncronas (p. ej. una petición DELETE por
// cada registro seleccionado) para saber cuántas han terminado, sin decidir
// por el llamador cómo combinarlas (Promise.all vs Promise.allSettled) ni
// cómo gestionar los fallos: cada vista conserva su propio comportamiento ya
// establecido y solo envuelve sus tareas para reportar avance.
export function useProgresoTareas() {
  const enCurso = ref(false)
  const procesadas = ref(0)
  const total = ref(0)

  function envolver<T>(tareas: (() => Promise<T>)[]): (() => Promise<T>)[] {
    total.value = tareas.length
    procesadas.value = 0
    enCurso.value = true
    return tareas.map((tarea) => async () => {
      try {
        return await tarea()
      } finally {
        procesadas.value++
      }
    })
  }

  function terminar(): void {
    enCurso.value = false
  }

  return { enCurso, procesadas, total, envolver, terminar }
}
