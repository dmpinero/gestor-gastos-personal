import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clienteApi, ErrorApi } from '../cliente'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cliente API - propagación de errores', () => {
  it('un error 500 con traza en el JSON se propaga en ErrorApi.traza', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detalle: 'boom', traza: 'Traceback...' }), { status: 500 }),
    )

    await expect(clienteApi.obtener('/algo')).rejects.toMatchObject({
      estado: 500,
      message: 'boom',
      traza: 'Traceback...',
    })
  })

  it('un error 422 sin traza deja ErrorApi.traza undefined', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detalle: 'dato inválido' }), { status: 422 }),
    )

    const error = (await clienteApi.obtener('/algo').catch((e: unknown) => e)) as ErrorApi

    expect(error).toBeInstanceOf(ErrorApi)
    expect(error.traza).toBeUndefined()
  })
})

function respuestaStreamNdjson(objetos: object[], status = 200): Response {
  const codificador = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controlador) {
      for (const objeto of objetos) {
        controlador.enqueue(codificador.encode(`${JSON.stringify(objeto)}\n`))
      }
      controlador.close()
    },
  })
  return new Response(stream, { status })
}

describe('cliente API - subirArchivoConProgreso', () => {
  it('llama a alProgreso por cada línea de progreso y resuelve con el resumen final', async () => {
    vi.mocked(fetch).mockResolvedValue(
      respuestaStreamNdjson([
        { tipo: 'progreso', procesadas: 1, total: 2 },
        { tipo: 'progreso', procesadas: 2, total: 2 },
        { tipo: 'resumen', movimientos_importados: 2 },
      ]),
    )
    const alProgreso = vi.fn<(procesadas: number, total: number) => void>()
    const fichero = new File(['contenido'], 'movimientos.xlsx')

    const resultado = await clienteApi.subirArchivoConProgreso(
      '/movimientos/importar',
      'fichero',
      fichero,
      alProgreso,
    )

    expect(alProgreso).toHaveBeenNthCalledWith(1, 1, 2)
    expect(alProgreso).toHaveBeenNthCalledWith(2, 2, 2)
    expect(resultado).toEqual({ movimientos_importados: 2 })
  })

  it('si el flujo termina sin línea "resumen", lanza ErrorApi', async () => {
    vi.mocked(fetch).mockResolvedValue(
      respuestaStreamNdjson([{ tipo: 'progreso', procesadas: 1, total: 3 }]),
    )

    await expect(
      clienteApi.subirArchivoConProgreso(
        '/x',
        'fichero',
        new File(['a'], 'a.xlsx'),
        vi.fn<(procesadas: number, total: number) => void>(),
      ),
    ).rejects.toBeInstanceOf(ErrorApi)
  })

  it('un error HTTP se propaga como ErrorApi sin intentar leer el flujo', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detalle: 'fichero vacío' }), { status: 422 }),
    )

    await expect(
      clienteApi.subirArchivoConProgreso(
        '/x',
        'fichero',
        new File(['a'], 'a.xlsx'),
        vi.fn<(procesadas: number, total: number) => void>(),
      ),
    ).rejects.toMatchObject({ estado: 422, message: 'fichero vacío' })
  })
})
