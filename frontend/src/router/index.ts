import { createRouter, createWebHistory } from 'vue-router'
import VistaInicio from '@/vistas/VistaInicio.vue'
import VistaGestion from '@/vistas/VistaGestion.vue'
import VistaCuentas from '@/vistas/VistaCuentas.vue'
import VistaCategorias from '@/vistas/VistaCategorias.vue'
import VistaMovimientos from '@/vistas/VistaMovimientos.vue'
import VistaImportarExcel from '@/vistas/VistaImportarExcel.vue'
import VistaHistorialGastos from '@/vistas/VistaHistorialGastos.vue'
import VistaResumenAnual from '@/vistas/VistaResumenAnual.vue'
import VistaAdministracion from '@/vistas/VistaAdministracion.vue'
import VistaExportarDatos from '@/vistas/VistaExportarDatos.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'inicio',
      component: VistaInicio,
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
          path: 'movimientos',
          name: 'gestion-movimientos',
          component: VistaMovimientos,
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
      path: '/administracion',
      component: VistaAdministracion,
      redirect: '/administracion/exportar-datos',
      children: [
        {
          path: 'exportar-datos',
          name: 'administracion-exportar-datos',
          component: VistaExportarDatos,
        },
      ],
    },
  ],
})

export default router
