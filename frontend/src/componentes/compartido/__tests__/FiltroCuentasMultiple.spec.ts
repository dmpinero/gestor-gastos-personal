import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import FiltroCuentasMultiple from '../FiltroCuentasMultiple.vue'

const cuentas = [
  {
    id: 1,
    numero_cuenta: 'ES00 1111',
    alias: 'Cuenta A',
    entidad_bancaria: null,
    moneda: null,
    titular: null,
  },
  {
    id: 2,
    numero_cuenta: 'ES00 2222',
    alias: null,
    entidad_bancaria: null,
    moneda: null,
    titular: null,
  },
]

afterEach(() => {
  document.body.innerHTML = ''
})

describe('FiltroCuentasMultiple', () => {
  it('con todas las cuentas seleccionadas muestra "Todas las cuentas"', () => {
    const wrapper = mount(FiltroCuentasMultiple, {
      props: { cuentas, modelValue: [1, 2] },
    })

    expect(wrapper.text()).toContain('Todas las cuentas')
  })

  it('con una cuenta seleccionada muestra su nombre', () => {
    const wrapper = mount(FiltroCuentasMultiple, {
      props: { cuentas, modelValue: [1] },
    })

    expect(wrapper.text()).toContain('Cuenta A')
  })

  it('con ninguna cuenta seleccionada muestra "Ninguna cuenta"', () => {
    const wrapper = mount(FiltroCuentasMultiple, {
      props: { cuentas, modelValue: [] },
    })

    expect(wrapper.text()).toContain('Ninguna cuenta')
  })

  it('marcar una cuenta individual emite el modelo actualizado', async () => {
    const wrapper = mount(FiltroCuentasMultiple, {
      props: { cuentas, modelValue: [1] },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    const checkboxCuentaB = document.body.querySelector<HTMLElement>('#filtro-cuenta-2')
    checkboxCuentaB?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([[[1, 2]]])
    wrapper.unmount()
  })

  it('desmarcar una cuenta individual la quita del modelo', async () => {
    const wrapper = mount(FiltroCuentasMultiple, {
      props: { cuentas, modelValue: [1, 2] },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    const checkboxCuentaA = document.body.querySelector<HTMLElement>('#filtro-cuenta-1')
    checkboxCuentaA?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([[[2]]])
    wrapper.unmount()
  })

  it('"Seleccionar todas" marca todas las cuentas de golpe', async () => {
    const wrapper = mount(FiltroCuentasMultiple, {
      props: { cuentas, modelValue: [] },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    const checkboxTodas = document.body.querySelector<HTMLElement>('#filtro-cuentas-todas')
    checkboxTodas?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([[[1, 2]]])
    wrapper.unmount()
  })

  it('desmarcar "Seleccionar todas" cuando están todas marcadas las vacía', async () => {
    const wrapper = mount(FiltroCuentasMultiple, {
      props: { cuentas, modelValue: [1, 2] },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    const checkboxTodas = document.body.querySelector<HTMLElement>('#filtro-cuentas-todas')
    checkboxTodas?.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]])
    wrapper.unmount()
  })
})
