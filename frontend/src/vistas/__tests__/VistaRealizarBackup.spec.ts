import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaRealizarBackup from '../VistaRealizarBackup.vue'

const { driverMock } = vi.hoisted(() => {
  const driverMock = vi.fn<(config: Config) => { drive: () => void; destroy: () => void }>(() => ({
    drive: vi.fn<() => void>(),
    destroy: vi.fn<() => void>(),
  }))
  return { driverMock }
})
vi.mock('driver.js', () => ({ driver: driverMock }))
vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'backup-realizar' }) }))

describe('VistaRealizarBackup — tour guiado', () => {
  it('el tour recorre el bloque de realizar backup', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaRealizarBackup, { global: { plugins: [pinia] } })

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-backup"]',
      '[data-tour="backup-accion"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    contenedor.unmount()
  })
})
