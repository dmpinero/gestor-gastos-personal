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
  it('muestra el changelog renderizado tras abrir el diálogo', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('## 1.0.0\n\n### Novedades\n\n* primera versión', { status: 200 }),
    )

    const wrapper = mount(ModalChangelog, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 0))
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('primera versión')
    wrapper.unmount()
  })

  it('muestra un error si la carga del changelog falla', async () => {
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
