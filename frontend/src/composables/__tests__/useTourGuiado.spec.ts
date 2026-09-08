import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'
import { useRegistrarTourPagina, useTourGuiado, type ProveedorTourPagina } from '../useTourGuiado'

const { driveMock, destroyMock, driverMock } = vi.hoisted(() => {
  const driveMock = vi.fn<() => void>()
  const destroyMock = vi.fn<() => void>()
  const driverMock = vi.fn<
    (config: Config) => { drive: typeof driveMock; destroy: typeof destroyMock }
  >(() => ({ drive: driveMock, destroy: destroyMock }))
  return { driveMock, destroyMock, driverMock }
})
vi.mock('driver.js', () => ({ driver: driverMock }))

const rutaMock = vi.hoisted(() => ({ name: 'inicio' as string | undefined }))
vi.mock('vue-router', () => ({ useRoute: () => rutaMock }))

function montarPaginaDePrueba(proveedor: ProveedorTourPagina) {
  return mount(
    defineComponent({
      setup() {
        useRegistrarTourPagina(proveedor)
        return () => h('div')
      },
    }),
  )
}

describe('useTourGuiado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rutaMock.name = 'inicio'
  })

  it('sin proveedor registrado, el tour es solo orientación + cierre', () => {
    const { iniciar } = useTourGuiado()

    iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-dashboard"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
  })

  it('con una página registrada, compone orientación + pasos de la página + cierre', () => {
    const wrapper = montarPaginaDePrueba({
      pasos: () => [{ element: '[data-tour="paso-x"]', popover: { title: 'X', description: 'Y' } }],
    })
    const { iniciar } = useTourGuiado()

    iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.map((paso) => paso.element)).toEqual([
      '[data-tour="nav-dashboard"]',
      '[data-tour="paso-x"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
    wrapper.unmount()
  })

  it('al desmontarse la página, deja de aportar pasos al tour', () => {
    const wrapper = montarPaginaDePrueba({
      pasos: () => [{ element: '[data-tour="paso-x"]', popover: { title: 'X', description: 'Y' } }],
    })
    wrapper.unmount()
    const { iniciar } = useTourGuiado()

    iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps).toHaveLength(3)
  })

  it.each([
    ['inicio', '[data-tour="nav-dashboard"]'],
    ['movimientos', '[data-tour="nav-movimientos"]'],
    ['gestion-cuentas', '[data-tour="nav-gestion"]'],
    ['gestion-conceptos', '[data-tour="nav-gestion"]'],
    ['importar', '[data-tour="nav-importar"]'],
    ['historial-categoria', '[data-tour="nav-historial"]'],
    ['resumen-anual', '[data-tour="nav-resumen-anual"]'],
    ['backup-realizar', '[data-tour="nav-backup"]'],
    ['backup-importar', '[data-tour="nav-backup"]'],
  ])('la orientación para la ruta "%s" resalta %s', (nombreRuta, selectorEsperado) => {
    rutaMock.name = nombreRuta
    const { iniciar } = useTourGuiado()

    iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    expect(config?.steps?.[0]?.element).toBe(selectorEsperado)
  })

  it('llama a antesDeIniciar antes de construir los pasos de la página', () => {
    const antesDeIniciar = vi.fn<() => void>()
    const wrapper = montarPaginaDePrueba({ pasos: () => [], antesDeIniciar })
    const { iniciar } = useTourGuiado()

    iniciar()

    expect(antesDeIniciar).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('al cerrarse el tour, llama a alFinalizar y destruye la instancia de driver.js', () => {
    const alFinalizar = vi.fn<() => void>()
    const wrapper = montarPaginaDePrueba({ pasos: () => [], alFinalizar })
    const { iniciar } = useTourGuiado()

    iniciar()
    const config = driverMock.mock.calls[0]?.[0]
    config?.onDestroyStarted?.(
      undefined,
      {} as Parameters<NonNullable<Config['onDestroyStarted']>>[1],
      {} as Parameters<NonNullable<Config['onDestroyStarted']>>[2],
    )

    expect(alFinalizar).toHaveBeenCalledTimes(1)
    expect(destroyMock).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('cada paso tiene título y descripción no vacíos', () => {
    const wrapper = montarPaginaDePrueba({
      pasos: () => [{ element: '[data-tour="paso-x"]', popover: { title: 'X', description: 'Y' } }],
    })
    const { iniciar } = useTourGuiado()

    iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    for (const paso of config?.steps ?? []) {
      expect(paso.popover?.title?.length).toBeGreaterThan(0)
      expect(paso.popover?.description?.length).toBeGreaterThan(0)
    }
    wrapper.unmount()
  })

  it('inicia la visita al llamar a iniciar()', () => {
    const { iniciar } = useTourGuiado()

    iniciar()

    expect(driveMock).toHaveBeenCalledTimes(1)
  })

  it('traduce al español el aria-label del botón de cerrar de driver.js', () => {
    const { iniciar } = useTourGuiado()

    iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    const closeButton = document.createElement('button')
    config?.onPopoverRender?.(
      { closeButton } as unknown as Parameters<NonNullable<Config['onPopoverRender']>>[0],
      {} as Parameters<NonNullable<Config['onPopoverRender']>>[1],
    )
    expect(closeButton.getAttribute('aria-label')).toBe('Cerrar')
  })
})
