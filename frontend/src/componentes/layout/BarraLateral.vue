<script setup lang="ts">
import {
  ArchiveRestore,
  ArrowLeftRight,
  CalendarRange,
  ChevronRight,
  Database,
  DatabaseBackup,
  History,
  LayoutDashboard,
  Settings2,
  Tag,
  Tags,
  Upload,
  Wallet,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaDashboard } from '@/stores/dashboard'
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
const tiendaDashboard = useTiendaDashboard()

onMounted(() => {
  tiendaCategorias.cargar()
  tiendaDashboard.cargar()
})

// Total neto de cada categoría (gastos + ingresos ya agregados por el
// backend en /dashboard/resumen), para colorear su icono en Historial:
// rojo si la categoría es predominantemente de gasto, verde si es de
// ingreso. Una categoría sin movimientos, o con gastos e ingresos que se
// compensan exactamente, se queda con el color neutro por defecto.
const netoPorCategoria = computed(() => {
  const mapa = new Map<number, number>()
  const resumen = tiendaDashboard.resumen
  if (!resumen) return mapa
  for (const item of [...resumen.gastos_por_categoria, ...resumen.ingresos_por_categoria]) {
    mapa.set(item.categoria_id, (mapa.get(item.categoria_id) ?? 0) + Number(item.total))
  }
  return mapa
})

function colorCategoria(idCategoria: number): string {
  const neto = netoPorCategoria.value.get(idCategoria)
  if (!neto) return 'text-violet-500'
  return neto < 0 ? 'text-destructive' : 'text-success dark:text-emerald-500'
}

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

const subseccionesAdministracion = [
  {
    a: '/administracion/backup',
    etiqueta: 'Realizar backup',
    icono: DatabaseBackup,
    color: 'text-sky-500',
  },
  {
    a: '/administracion/importar-backup',
    etiqueta: 'Importar backup',
    icono: ArchiveRestore,
    color: 'text-amber-500',
  },
]

function administracionActiva(path: string): boolean {
  return path.startsWith('/administracion')
}

const gestionAbierta = ref(gestionActiva(ruta.path))
const historialAbierta = ref(historialActivo(ruta.path))
const administracionAbierta = ref(administracionActiva(ruta.path))
const categoriasAbiertas = ref<Set<number>>(new Set())

function categoriaAbierta(idCategoria: number): boolean {
  return categoriasAbiertas.value.has(idCategoria)
}

function alternarCategoria(idCategoria: number, abierta: boolean): void {
  const nuevo = new Set(categoriasAbiertas.value)
  if (abierta) nuevo.add(idCategoria)
  else nuevo.delete(idCategoria)
  categoriasAbiertas.value = nuevo
}

// Al navegar a una sección (o a la categoría/subcategoría de Historial que
// corresponda), se expande automáticamente si estaba colapsada; nunca se
// contrae sola (para no ocultar de golpe lo que el usuario abrió).
watch(
  [() => ruta.path, () => tiendaCategorias.categorias],
  ([path, categorias]) => {
    if (gestionActiva(path)) gestionAbierta.value = true
    if (historialActivo(path)) historialAbierta.value = true
    if (administracionActiva(path)) administracionAbierta.value = true
    for (const item of categorias) {
      const enEstaCategoria =
        path === `/historial/categoria/${item.categoria.id}` ||
        item.subcategorias.some((sub) => path === `/historial/subcategoria/${sub.id}`)
      if (enEstaCategoria) alternarCategoria(item.categoria.id, true)
    }
  },
  { immediate: true },
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
                      <Collapsible
                        :open="categoriaAbierta(item.categoria.id)"
                        class="relative"
                        @update:open="(valor) => alternarCategoria(item.categoria.id, valor)"
                      >
                        <SidebarMenuSubButton
                          as-child
                          :is-active="ruta.path === `/historial/categoria/${item.categoria.id}`"
                          :class="item.subcategorias.length > 0 ? 'pr-7' : ''"
                        >
                          <RouterLink
                            :to="`/historial/categoria/${item.categoria.id}`"
                            :aria-current="
                              ruta.path === `/historial/categoria/${item.categoria.id}`
                                ? 'page'
                                : undefined
                            "
                          >
                            <Tag :class="colorCategoria(item.categoria.id)" />
                            <span class="truncate">{{ item.categoria.nombre }}</span>
                          </RouterLink>
                        </SidebarMenuSubButton>
                        <CollapsibleTrigger v-if="item.subcategorias.length > 0" as-child>
                          <button
                            type="button"
                            :aria-label="
                              categoriaAbierta(item.categoria.id)
                                ? `Contraer ${item.categoria.nombre}`
                                : `Expandir ${item.categoria.nombre}`
                            "
                            class="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-0.5 right-0.5 flex size-6 items-center justify-center rounded-md"
                          >
                            <ChevronRight
                              class="size-3.5 transition-transform"
                              :class="categoriaAbierta(item.categoria.id) ? 'rotate-90' : ''"
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent v-if="item.subcategorias.length > 0">
                          <ul class="ml-6 flex flex-col gap-0.5 py-0.5">
                            <li v-for="sub in item.subcategorias" :key="sub.id">
                              <RouterLink
                                :to="`/historial/subcategoria/${sub.id}`"
                                :aria-current="
                                  ruta.path === `/historial/subcategoria/${sub.id}`
                                    ? 'page'
                                    : undefined
                                "
                                class="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground block truncate rounded-md px-2 py-1 text-xs aria-[current=page]:font-medium"
                              >
                                {{ sub.nombre }}
                              </RouterLink>
                            </li>
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
              <SidebarMenuButton
                as-child
                :is-active="ruta.path === '/resumen-anual'"
                tooltip="Resumen anual"
              >
                <RouterLink
                  to="/resumen-anual"
                  :aria-current="ruta.path === '/resumen-anual' ? 'page' : undefined"
                >
                  <CalendarRange class="text-fuchsia-500" />
                  <span>Resumen anual</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible v-model:open="administracionAbierta" as-child>
              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="administracionActiva(ruta.path)"
                  tooltip="Administración"
                >
                  <RouterLink
                    to="/administracion"
                    :aria-current="administracionActiva(ruta.path) ? 'page' : undefined"
                  >
                    <Database class="text-orange-500" />
                    <span>Administración</span>
                  </RouterLink>
                </SidebarMenuButton>
                <CollapsibleTrigger as-child>
                  <SidebarMenuAction
                    :aria-label="
                      administracionAbierta ? 'Contraer Administración' : 'Expandir Administración'
                    "
                  >
                    <ChevronRight
                      class="transition-transform"
                      :class="administracionAbierta ? 'rotate-90' : ''"
                    />
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem v-for="sub in subseccionesAdministracion" :key="sub.a">
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
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
