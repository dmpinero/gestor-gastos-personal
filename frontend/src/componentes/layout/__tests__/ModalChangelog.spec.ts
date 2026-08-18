import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ModalChangelog from '../ModalChangelog.vue'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>())
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('ModalChangelog', () => {
  it('muestra el historial de releases de GitHub renderizado tras abrir el diálogo', async () => {
    const releases = [
      {
        tag_name: 'v1.0.0',
        name: 'v1.0.0',
        body: '### ✨ Novedades\n\n* primera versión',
        published_at: '2026-08-15T00:00:00Z',
        html_url: 'https://github.com/dmpinero/gestor-gastos-personal/releases/tag/v1.0.0',
      },
    ]
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(releases), { status: 200 }))

    const wrapper = mount(ModalChangelog, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 0))
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('primera versión')
    wrapper.unmount()
  })

  it('muestra un error si la carga del historial de GitHub falla', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }))

    const wrapper = mount(ModalChangelog, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 0))
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar',
    )
    wrapper.unmount()
  })
})
