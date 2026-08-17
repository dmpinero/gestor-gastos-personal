<script setup lang="ts">
import { ArrowLeftRight, Home, Tags, Upload, Wallet } from '@lucide/vue'
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
  { a: '/', etiqueta: 'Inicio', icono: Home },
  { a: '/cuentas', etiqueta: 'Cuentas', icono: Wallet },
  { a: '/categorias', etiqueta: 'Categorías', icono: Tags },
  { a: '/movimientos', etiqueta: 'Movimientos', icono: ArrowLeftRight },
  { a: '/importar', etiqueta: 'Importar', icono: Upload },
]
</script>

<template>
  <Sidebar side="right" collapsible="icon">
    <SidebarHeader class="flex flex-row items-center justify-end">
      <SidebarTrigger />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="seccion in secciones" :key="seccion.a">
              <SidebarMenuButton
                as-child
                :is-active="ruta.path === seccion.a"
                :tooltip="seccion.etiqueta"
              >
                <RouterLink :to="seccion.a">
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
