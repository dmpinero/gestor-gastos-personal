import { driver, type DriveStep } from 'driver.js'

const pasos: DriveStep[] = [
  {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: 'Dashboard',
      description:
        'Resumen general: saldo por cuenta y totales de gastos e ingresos por categoría.',
    },
  },
  {
    element: '[data-tour="nav-gestion"]',
    popover: {
      title: 'Gestión',
      description:
        'Da de alta y edita tus cuentas bancarias, categorías/subcategorías y movimientos.',
    },
  },
  {
    element: '[data-tour="nav-importar"]',
    popover: {
      title: 'Importar',
      description:
        'Sube extractos bancarios en Excel o PDF para dar de alta movimientos en bloque, sin introducirlos a mano.',
    },
  },
  {
    element: '[data-tour="nav-historial"]',
    popover: {
      title: 'Historial',
      description:
        'Consulta la evolución de una categoría o subcategoría a lo largo del tiempo, con filtros y gráficos.',
    },
  },
  {
    element: '[data-tour="nav-resumen-anual"]',
    popover: {
      title: 'Resumen anual',
      description:
        'Compara lo previsto con lo real, mes a mes, para cada concepto de tu presupuesto anual.',
    },
  },
  {
    element: '[data-tour="nav-administracion"]',
    popover: {
      title: 'Administración',
      description:
        'Copias de seguridad y asociaciones entre conceptos previstos y las categorías reales de tus movimientos.',
    },
  },
  {
    element: '[data-tour="conmutador-tema"]',
    popover: {
      title: 'Tema claro/oscuro',
      description:
        'Cambia entre modo claro y oscuro. Tu preferencia se recuerda para la próxima vez.',
    },
  },
  {
    element: '[data-tour="boton-manual-usuario"]',
    popover: {
      title: 'Ayuda',
      description: 'Vuelve a abrir este manual interactivo cuando quieras, pulsando este icono.',
    },
  },
]

export function useTourGuiado() {
  function iniciar(): void {
    driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Terminar',
      steps: pasos,
      // El botón de cerrar de driver.js trae aria-label="Close" fijo en
      // inglés (no es configurable vía las opciones de arriba); se corrige
      // aquí para que toda la interfaz del tour quede en español.
      onPopoverRender: (popover) => {
        popover.closeButton.setAttribute('aria-label', 'Cerrar')
      },
    }).drive()
  }

  return { iniciar }
}
