<script setup lang="ts">
import { Home, LayoutDashboard } from '@lucide/vue'
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
  SidebarTrigger,
} from '@/componentes/ui/sidebar'

const ruta = useRoute()

const secciones = [
  { a: '/', etiqueta: 'Inicio', icono: Home, activa: (ruta: string) => ruta === '/' },
  {
    a: '/gestion',
    etiqueta: 'Gestión',
    icono: LayoutDashboard,
    activa: (ruta: string) => ruta.startsWith('/gestion'),
  },
]
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
            <SidebarMenuItem v-for="seccion in secciones" :key="seccion.a">
              <SidebarMenuButton
                as-child
                :is-active="seccion.activa(ruta.path)"
                :tooltip="seccion.etiqueta"
              >
                <RouterLink
                  :to="seccion.a"
                  :aria-current="seccion.activa(ruta.path) ? 'page' : undefined"
                >
                  <component :is="seccion.icono" />
                  <span>{{ seccion.etiqueta }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
