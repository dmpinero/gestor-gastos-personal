import { createRouter, createWebHistory } from 'vue-router'
import VistaInicio from '@/vistas/VistaInicio.vue'
import VistaMovimientos from '@/vistas/VistaMovimientos.vue'
import VistaGestion from '@/vistas/VistaGestion.vue'
import VistaCuentas from '@/vistas/VistaCuentas.vue'
import VistaCategorias from '@/vistas/VistaCategorias.vue'
import VistaImportarExcel from '@/vistas/VistaImportarExcel.vue'
import VistaHistorialGastos from '@/vistas/VistaHistorialGastos.vue'
import VistaResumenAnual from '@/vistas/VistaResumenAnual.vue'
import VistaGestionConceptos from '@/vistas/VistaGestionConceptos.vue'
import VistaBackup from '@/vistas/VistaBackup.vue'
import VistaRealizarBackup from '@/vistas/VistaRealizarBackup.vue'
import VistaImportarBackup from '@/vistas/VistaImportarBackup.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'inicio',
      component: VistaInicio,
    },
    {
      path: '/movimientos',
      name: 'movimientos',
      component: VistaMovimientos,
    },
    {
      path: '/gestion',
      component: VistaGestion,
      redirect: '/gestion/cuentas',
      children: [
        {
          path: 'cuentas',
          name: 'gestion-cuentas',
          component: VistaCuentas,
        },
        {
          path: 'categorias',
          name: 'gestion-categorias',
          component: VistaCategorias,
        },
        {
          path: 'conceptos',
          name: 'gestion-conceptos',
          component: VistaGestionConceptos,
        },
      ],
    },
    {
      path: '/importar',
      name: 'importar',
      component: VistaImportarExcel,
    },
    {
      path: '/historial',
      name: 'historial',
      component: VistaHistorialGastos,
    },
    {
      path: '/historial/categoria/:id',
      name: 'historial-categoria',
      component: VistaHistorialGastos,
    },
    {
      path: '/historial/subcategoria/:id',
      name: 'historial-subcategoria',
      component: VistaHistorialGastos,
    },
    {
      path: '/resumen-anual',
      name: 'resumen-anual',
      component: VistaResumenAnual,
    },
    {
      path: '/backup',
      component: VistaBackup,
      redirect: '/backup/realizar',
      children: [
        {
          path: 'realizar',
          name: 'backup-realizar',
          component: VistaRealizarBackup,
        },
        {
          path: 'importar',
          name: 'backup-importar',
          component: VistaImportarBackup,
        },
      ],
    },
  ],
})

export default router
