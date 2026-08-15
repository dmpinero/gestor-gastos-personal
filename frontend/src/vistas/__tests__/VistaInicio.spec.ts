import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import VistaInicio from '../VistaInicio.vue'

describe('VistaInicio', () => {
  it('muestra el mensaje de bienvenida', () => {
    const contenedor = mount(VistaInicio)

    expect(contenedor.text()).toContain('Bienvenido')
  })
})
