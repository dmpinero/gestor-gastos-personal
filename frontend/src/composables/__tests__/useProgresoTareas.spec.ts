import { describe, expect, it } from 'vitest'
import { useProgresoTareas } from '../useProgresoTareas'

// Promesa que se resuelve/rechaza solo cuando se llama explícitamente a
// resolver()/rechazar(), para poder comprobar el estado intermedio del
// progreso mientras las tareas están "en vuelo".
function promesaControlada<T>(): {
  promesa: Promise<T>
  resolver: (valor: T) => void
  rechazar: (motivo: unknown) => void
} {
  let resolver!: (valor: T) => void
  let rechazar!: (motivo: unknown) => void
  const promesa = new Promise<T>((resolve, reject) => {
    resolver = resolve
    rechazar = reject
  })
  return { promesa, resolver, rechazar }
}

describe('useProgresoTareas', () => {
  it('envolver fija el total y enCurso, y procesadas empieza en 0', () => {
    const progreso = useProgresoTareas()
    const controladas = [promesaControlada<void>(), promesaControlada<void>()]

    progreso.envolver(controladas.map((c) => () => c.promesa))

    expect(progreso.total.value).toBe(2)
    expect(progreso.procesadas.value).toBe(0)
    expect(progreso.enCurso.value).toBe(true)
  })

  it('procesadas se incrementa según se resuelven las tareas, una a una', async () => {
    const progreso = useProgresoTareas()
    const controladas = [
      promesaControlada<void>(),
      promesaControlada<void>(),
      promesaControlada<void>(),
    ]
    const tareas = progreso.envolver(controladas.map((c) => () => c.promesa))
    const ejecuciones = tareas.map((tarea) => tarea())

    expect(progreso.procesadas.value).toBe(0)

    controladas[0]!.resolver()
    await ejecuciones[0]
    expect(progreso.procesadas.value).toBe(1)

    controladas[1]!.resolver()
    await ejecuciones[1]
    expect(progreso.procesadas.value).toBe(2)

    controladas[2]!.resolver()
    await ejecuciones[2]
    expect(progreso.procesadas.value).toBe(3)
  })

  it('una tarea que rechaza también incrementa procesadas (el fallo no bloquea el contador)', async () => {
    const progreso = useProgresoTareas()
    const controlada = promesaControlada<void>()
    const [tarea] = progreso.envolver([() => controlada.promesa])

    const ejecucion = tarea!().catch(() => {
      // Se espera el rechazo; solo interesa comprobar procesadas.
    })
    controlada.rechazar(new Error('boom'))
    await ejecucion

    expect(progreso.procesadas.value).toBe(1)
  })

  it('terminar pone enCurso a false sin tocar procesadas/total', () => {
    const progreso = useProgresoTareas()
    progreso.envolver([() => Promise.resolve()])

    progreso.terminar()

    expect(progreso.enCurso.value).toBe(false)
    expect(progreso.total.value).toBe(1)
  })

  it('una segunda llamada a envolver reinicia procesadas y total para el nuevo lote', () => {
    const progreso = useProgresoTareas()
    progreso.envolver([() => Promise.resolve(), () => Promise.resolve()])
    progreso.terminar()

    progreso.envolver([() => Promise.resolve()])

    expect(progreso.total.value).toBe(1)
    expect(progreso.procesadas.value).toBe(0)
    expect(progreso.enCurso.value).toBe(true)
  })
})
