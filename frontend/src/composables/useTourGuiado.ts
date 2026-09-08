import { onMounted, onUnmounted, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { driver, type DriveStep } from 'driver.js'

export interface ProveedorTourPagina {
  pasos: () => DriveStep[]
  antesDeIniciar?: () => void
  alFinalizar?: () => void
}

// Solo puede haber una página con tour registrado a la vez: se activa al
// montarse (onMounted) y se libera al desmontarse (onUnmounted), reflejando
// siempre la Vista actualmente visible sin necesidad de una store.
const proveedorActual = shallowRef<ProveedorTourPagina | null>(null)

export function useRegistrarTourPagina(proveedor: ProveedorTourPagina): void {
  onMounted(() => {
    proveedorActual.value = proveedor
  })
  onUnmounted(() => {
    if (proveedorActual.value === proveedor) proveedorActual.value = null
  })
}

type SeccionMenu =
  'dashboard' | 'movimientos' | 'gestion' | 'importar' | 'historial' | 'resumen-anual' | 'backup'

const SECCION_POR_RUTA: Record<string, SeccionMenu> = {
  inicio: 'dashboard',
  movimientos: 'movimientos',
  'gestion-cuentas': 'gestion',
  'gestion-categorias': 'gestion',
  'gestion-conceptos': 'gestion',
  importar: 'importar',
  historial: 'historial',
  'historial-categoria': 'historial',
  'historial-subcategoria': 'historial',
  'resumen-anual': 'resumen-anual',
  'backup-realizar': 'backup',
  'backup-importar': 'backup',
}

const ORIENTACION_POR_SECCION: Record<SeccionMenu, DriveStep> = {
  dashboard: {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: 'Dashboard',
      description:
        'Resumen general: saldo por cuenta y totales de gastos e ingresos por categoría.',
    },
  },
  movimientos: {
    element: '[data-tour="nav-movimientos"]',
    popover: {
      title: 'Movimientos',
      description: 'Registra, edita y filtra tus movimientos de gastos e ingresos.',
    },
  },
  gestion: {
    element: '[data-tour="nav-gestion"]',
    popover: {
      title: 'Gestión',
      description:
        'Administra tus cuentas, categorías, y las asociaciones entre conceptos previstos y categorías reales.',
    },
  },
  importar: {
    element: '[data-tour="nav-importar"]',
    popover: {
      title: 'Importar',
      description:
        'Sube extractos bancarios en Excel o PDF para dar de alta movimientos en bloque, sin introducirlos a mano.',
    },
  },
  historial: {
    element: '[data-tour="nav-historial"]',
    popover: {
      title: 'Historial',
      description:
        'Consulta la evolución de una categoría o subcategoría a lo largo del tiempo, con filtros y gráficos.',
    },
  },
  'resumen-anual': {
    element: '[data-tour="nav-resumen-anual"]',
    popover: {
      title: 'Resumen anual',
      description:
        'Compara lo previsto con lo real, mes a mes, para cada concepto de tu presupuesto anual.',
    },
  },
  backup: {
    element: '[data-tour="nav-backup"]',
    popover: {
      title: 'Backup',
      description: 'Realiza copias de seguridad de tus datos o restaura una copia anterior.',
    },
  },
}

function pasoOrientacion(nombreRuta: string | null | undefined): DriveStep[] {
  const seccion = SECCION_POR_RUTA[nombreRuta ?? '']
  return seccion ? [ORIENTACION_POR_SECCION[seccion]] : []
}

const pasosCierre: DriveStep[] = [
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
  const ruta = useRoute()

  function iniciar(): void {
    const proveedor = proveedorActual.value
    proveedor?.antesDeIniciar?.()

    const pasos = [
      ...pasoOrientacion(ruta.name?.toString()),
      ...(proveedor?.pasos() ?? []),
      ...pasosCierre,
    ]

    const instancia = driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Terminar',
      steps: pasos,
      skipMissingElement: true,
      // El botón de cerrar de driver.js trae aria-label="Close" fijo en
      // inglés (no es configurable vía las opciones de arriba); se corrige
      // aquí para que toda la interfaz del tour quede en español.
      onPopoverRender: (popover) => {
        popover.closeButton.setAttribute('aria-label', 'Cerrar')
      },
      // Al pasar onDestroyStarted, driver.js NO cierra el tour por sí solo
      // (delega la decisión al consumidor): hay que llamar a destroy() aquí
      // para que el cierre (botón, Escape, fin del recorrido) siga
      // funcionando, además de restaurar el estado que la página haya
      // forzado temporalmente para este tour.
      onDestroyStarted: () => {
        proveedor?.alFinalizar?.()
        instancia.destroy()
      },
    })
    instancia.drive()
  }

  return { iniciar }
}
