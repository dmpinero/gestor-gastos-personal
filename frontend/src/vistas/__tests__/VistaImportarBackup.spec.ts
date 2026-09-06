import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'

import { useTourGuiado } from '@/composables/useTourGuiado'
import VistaImportarBackup from '../VistaImportarBackup.vue'

const { driverMock } = vi.hoisted(() => {
  const driverMock = vi.fn<(config: Config) => { drive: () => void; destroy: () => void }>(() => ({
    drive: vi.fn<() => void>(),
    destroy: vi.fn<() => void>(),
  }))
  return { driverMock }
})
vi.mock('driver.js', () => ({ driver: driverMock }))
vi.mock('vue-router', () => ({ useRoute: () => ({ name: 'administracion-importar-backup' }) }))

describe('VistaImportarBackup — tour guiado', () => {
  it('el tour recorre el bloque de importar backup y advierte de que es destructivo', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const contenedor = mount(VistaImportarBackup, { global: { plugins: [pinia] } })

    useTourGuiado().iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-administracion"]',
      '[data-tour="importar-backup-accion"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    const pasoImportar = config?.steps?.find(
      (paso) => paso.element === '[data-tour="importar-backup-accion"]',
    )
    expect(pasoImportar?.popover?.description).toContain('sustituye')
    contenedor.unmount()
  })
})
