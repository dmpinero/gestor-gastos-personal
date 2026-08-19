<script setup lang="ts">
import {
  ArrowLeftRight,
  ChevronRight,
  History,
  LayoutDashboard,
  Settings2,
  Tag,
  Tags,
  Upload,
  Wallet,
} from '@lucide/vue'
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useTiendaCategorias } from '@/stores/categorias'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/componentes/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from '@/componentes/ui/sidebar'

const ruta = useRoute()
const tiendaCategorias = useTiendaCategorias()

onMounted(() => {
  tiendaCategorias.cargar()
})

const subseccionesGestion = [
  { a: '/gestion/cuentas', etiqueta: 'Cuentas', icono: Wallet, color: 'text-amber-500' },
  { a: '/gestion/categorias', etiqueta: 'Categorías', icono: Tags, color: 'text-teal-500' },
  {
    a: '/gestion/movimientos',
    etiqueta: 'Movimientos',
    icono: ArrowLeftRight,
    color: 'text-rose-500',
  },
]

function gestionActiva(path: string): boolean {
  return path.startsWith('/gestion')
}

function historialActivo(path: string): boolean {
  return path.startsWith('/historial')
}

const gestionAbierta = ref(gestionActiva(ruta.path))
const historialAbierta = ref(historialActivo(ruta.path))

// Al navegar a una sección, se expande automáticamente si estaba colapsada;
// nunca se contrae sola (para no ocultar de golpe lo que el usuario abrió).
watch(
  () => ruta.path,
  (path) => {
    if (gestionActiva(path)) gestionAbierta.value = true
    if (historialActivo(path)) historialAbierta.value = true
  },
)
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
              <SidebarMenuButton as-child :is-active="ruta.path === '/'" tooltip="Dashboard">
                <RouterLink to="/" :aria-current="ruta.path === '/' ? 'page' : undefined">
                  <LayoutDashboard class="text-blue-500" />
                  <span>Dashboard</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible v-model:open="gestionAbierta" as-child>
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
                <CollapsibleTrigger as-child>
                  <SidebarMenuAction
                    :aria-label="gestionAbierta ? 'Contraer Gestión' : 'Expandir Gestión'"
                  >
                    <ChevronRight
                      class="transition-transform"
                      :class="gestionAbierta ? 'rotate-90' : ''"
                    />
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
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
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
              <SidebarMenuButton as-child :is-active="ruta.path === '/importar'" tooltip="Importar">
                <RouterLink
                  to="/importar"
                  :aria-current="ruta.path === '/importar' ? 'page' : undefined"
                >
                  <Upload class="text-indigo-500" />
                  <span>Importar</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible v-model:open="historialAbierta" as-child>
              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="historialActivo(ruta.path)"
                  tooltip="Historial"
                >
                  <RouterLink
                    to="/historial"
                    :aria-current="historialActivo(ruta.path) ? 'page' : undefined"
                  >
                    <History class="text-cyan-500" />
                    <span>Historial</span>
                  </RouterLink>
                </SidebarMenuButton>
                <CollapsibleTrigger as-child>
                  <SidebarMenuAction
                    :aria-label="historialAbierta ? 'Contraer Historial' : 'Expandir Historial'"
                  >
                    <ChevronRight
                      class="transition-transform"
                      :class="historialAbierta ? 'rotate-90' : ''"
                    />
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem
                      v-for="item in tiendaCategorias.categorias"
                      :key="item.categoria.id"
                    >
                      <SidebarMenuSubButton
                        as-child
                        :is-active="ruta.path === `/historial/categoria/${item.categoria.id}`"
                      >
                        <RouterLink
                          :to="`/historial/categoria/${item.categoria.id}`"
                          :aria-current="
                            ruta.path === `/historial/categoria/${item.categoria.id}`
                              ? 'page'
                              : undefined
                          "
                        >
                          <Tag class="text-violet-500" />
                          <span class="truncate">{{ item.categoria.nombre }}</span>
                        </RouterLink>
                      </SidebarMenuSubButton>
                      <ul
                        v-if="item.subcategorias.length > 0"
                        class="ml-6 flex flex-col gap-0.5 py-0.5"
                      >
                        <li v-for="sub in item.subcategorias" :key="sub.id">
                          <RouterLink
                            :to="`/historial/subcategoria/${sub.id}`"
                            :aria-current="
                              ruta.path === `/historial/subcategoria/${sub.id}` ? 'page' : undefined
                            "
                            class="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground block truncate rounded-md px-2 py-1 text-xs aria-[current=page]:font-medium"
                          >
                            {{ sub.nombre }}
                          </RouterLink>
                        </li>
                      </ul>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
