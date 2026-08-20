import { afterEach, describe, expect, it, vi } from 'vitest'
import { descargarBlob } from '../descargas'

describe('descargarBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('crea un enlace temporal, dispara la descarga y libera el object URL', () => {
    const url = 'blob:mock-url'
    const createObjectURL = vi.fn<(blob: Blob) => string>().mockReturnValue(url)
    const revokeObjectURL = vi.fn<(url: string) => void>()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const clickSpy = vi.fn<() => void>()
    const enlaceFalso = {
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement
    const crearElementoOriginal = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((etiqueta: string) =>
      etiqueta === 'a' ? enlaceFalso : crearElementoOriginal(etiqueta),
    )

    const blob = new Blob(['contenido'])
    descargarBlob(blob, 'resumen-anual-2026.xlsx')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(enlaceFalso.href).toBe(url)
    expect(enlaceFalso.download).toBe('resumen-anual-2026.xlsx')
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith(url)
  })
})
