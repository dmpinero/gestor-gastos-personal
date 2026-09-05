import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import IconoOrigenPdf from '../IconoOrigenPdf.vue'

describe('IconoOrigenPdf', () => {
  it('muestra el icono con aria-label cuando el origen es "pdf"', () => {
    const wrapper = mount(IconoOrigenPdf, { props: { origen: 'pdf' } })

    expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe('Importado desde un PDF')
  })

  it('no muestra nada cuando el origen es null', () => {
    const wrapper = mount(IconoOrigenPdf, { props: { origen: null } })

    expect(wrapper.find('[role="img"]').exists()).toBe(false)
  })

  it('no muestra nada cuando el origen no viene informado', () => {
    const wrapper = mount(IconoOrigenPdf, { props: {} })

    expect(wrapper.find('[role="img"]').exists()).toBe(false)
  })

  it('no muestra nada para otros valores de origen', () => {
    const wrapper = mount(IconoOrigenPdf, { props: { origen: 'excel' } })

    expect(wrapper.find('[role="img"]').exists()).toBe(false)
  })
})
