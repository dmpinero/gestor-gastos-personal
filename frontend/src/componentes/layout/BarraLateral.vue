<script setup lang="ts">
import { LayoutDashboard, Settings2 } from '@lucide/vue'
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
  {
    a: '/',
    etiqueta: 'Inicio',
    icono: LayoutDashboard,
    color: 'text-blue-500',
    activa: (ruta: string) => ruta === '/',
  },
  {
    a: '/gestion',
    etiqueta: 'Gestión',
    icono: Settings2,
    color: 'text-violet-500',
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
                  <component :is="seccion.icono" :class="seccion.color" />
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
