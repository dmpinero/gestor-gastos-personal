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
