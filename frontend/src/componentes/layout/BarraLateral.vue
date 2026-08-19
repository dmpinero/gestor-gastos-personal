<script setup lang="ts">
import { ArrowLeftRight, LayoutDashboard, Settings2, Tags, Upload, Wallet } from '@lucide/vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from '@/componentes/ui/sidebar'

const ruta = useRoute()

const subseccionesGestion = [
  { a: '/gestion/cuentas', etiqueta: 'Cuentas', icono: Wallet, color: 'text-amber-500' },
  { a: '/gestion/categorias', etiqueta: 'Categorías', icono: Tags, color: 'text-teal-500' },
  {
    a: '/gestion/movimientos',
    etiqueta: 'Movimientos',
    icono: ArrowLeftRight,
    color: 'text-rose-500',
  },
  { a: '/gestion/importar', etiqueta: 'Importar', icono: Upload, color: 'text-indigo-500' },
]

function gestionActiva(path: string): boolean {
  return path.startsWith('/gestion')
}
</script>

<template>
  <Sidebar side="left" collapsible="icon">
    <SidebarHeader class="flex flex-row items-center justify-start">
      <SidebarTrigger />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child :is-active="ruta.path === '/'" tooltip="Inicio">
                <RouterLink to="/" :aria-current="ruta.path === '/' ? 'page' : undefined">
                  <LayoutDashboard class="text-blue-500" />
                  <span>Inicio</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton as-child :is-active="gestionActiva(ruta.path)" tooltip="Gestión">
                <RouterLink
                  to="/gestion"
                  :aria-current="gestionActiva(ruta.path) ? 'page' : undefined"
                >
                  <Settings2 class="text-violet-500" />
                  <span>Gestión</span>
                </RouterLink>
              </SidebarMenuButton>
              <SidebarMenuSub>
                <SidebarMenuSubItem v-for="sub in subseccionesGestion" :key="sub.a">
                  <SidebarMenuSubButton as-child :is-active="ruta.path === sub.a">
                    <RouterLink
                      :to="sub.a"
                      :aria-current="ruta.path === sub.a ? 'page' : undefined"
                    >
                      <component :is="sub.icono" :class="sub.color" />
                      <span>{{ sub.etiqueta }}</span>
                    </RouterLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
