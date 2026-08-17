import { createRouter, createWebHistory } from 'vue-router'
import VistaInicio from '@/vistas/VistaInicio.vue'
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
      path: '/cuentas',
      name: 'cuentas',
      component: VistaCuentas,
    },
    {
      path: '/categorias',
      name: 'categorias',
      component: VistaCategorias,
    },
    {
      path: '/movimientos',
      name: 'movimientos',
      component: VistaMovimientos,
    },
    {
      path: '/importar',
      name: 'importar',
      component: VistaImportarExcel,
    },
  ],
})

export default router
