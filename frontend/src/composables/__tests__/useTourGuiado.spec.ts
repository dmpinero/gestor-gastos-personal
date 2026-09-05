import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'driver.js'
import { useTourGuiado } from '../useTourGuiado'

const { driveMock, driverMock } = vi.hoisted(() => {
  const driveMock = vi.fn<() => void>()
  const driverMock = vi.fn<(config: Config) => { drive: typeof driveMock }>(() => ({
    drive: driveMock,
  }))
  return { driveMock, driverMock }
})
vi.mock('driver.js', () => ({ driver: driverMock }))

describe('useTourGuiado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('construye los pasos en el orden de la navegación principal', () => {
    const { iniciar } = useTourGuiado()

    iniciar()

    expect(driverMock).toHaveBeenCalledTimes(1)
    const config = driverMock.mock.calls[0]?.[0]
    const selectores = config?.steps?.map((paso) => paso.element)
    expect(selectores).toEqual([
      '[data-tour="nav-dashboard"]',
      '[data-tour="nav-gestion"]',
      '[data-tour="nav-importar"]',
      '[data-tour="nav-historial"]',
      '[data-tour="nav-resumen-anual"]',
      '[data-tour="nav-administracion"]',
      '[data-tour="conmutador-tema"]',
      '[data-tour="boton-manual-usuario"]',
    ])
  })

  it('cada paso tiene título y descripción no vacíos', () => {
    const { iniciar } = useTourGuiado()

    iniciar()

    const config = driverMock.mock.calls[0]?.[0]
    for (const paso of config?.steps ?? []) {
      expect(paso.popover?.title?.length).toBeGreaterThan(0)
      expect(paso.popover?.description?.length).toBeGreaterThan(0)
    }
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
