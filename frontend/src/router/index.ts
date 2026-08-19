import { createRouter, createWebHistory } from 'vue-router'
import VistaInicio from '@/vistas/VistaInicio.vue'
import VistaGestion from '@/vistas/VistaGestion.vue'
import VistaCuentas from '@/vistas/VistaCuentas.vue'
import VistaCategorias from '@/vistas/VistaCategorias.vue'
import VistaMovimientos from '@/vistas/VistaMovimientos.vue'
import VistaImportarExcel from '@/vistas/VistaImportarExcel.vue'

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
  ],
})

export default router
