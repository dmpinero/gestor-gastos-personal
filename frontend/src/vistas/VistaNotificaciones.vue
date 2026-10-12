<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, Euro, FileText, Layers, Repeat, Search, Tag, Tags } from '@lucide/vue'
import type { DriveStep } from 'driver.js'

import type { Periodicidad, ProximoEvento } from '@/api/tipos'
import { claseColorImporte, formatearFecha, formatearImporte } from '@/lib/formato'
import { useBusquedaTabla } from '@/composables/useBusquedaTabla'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import { usePaginacionTabla, type TamanoPagina } from '@/composables/usePaginacionTabla'
import { useRegistrarTourPagina } from '@/composables/useTourGuiado'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaNotificaciones } from '@/stores/notificaciones'
import BarraPaginacion from '@/componentes/compartido/BarraPaginacion.vue'
import CabeceraOrdenable from '@/componentes/compartido/CabeceraOrdenable.vue'
import SelectorTamanoPagina from '@/componentes/compartido/SelectorTamanoPagina.vue'
import TablaNotificacionesAgrupadaPorMes from '@/componentes/notificaciones/TablaNotificacionesAgrupadaPorMes.vue'
import { Badge } from '@/componentes/ui/badge'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'

const tiendaCategorias = useTiendaCategorias()
const tienda = useTiendaNotificaciones()

const NOMBRE_PERIODICIDAD: Record<Periodicidad, string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

const COLOR_PERIODICIDAD: Record<Periodicidad, string> = {
  mensual: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  trimestral: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  semestral: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  anual: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
}

const tamanoPagina = ref<TamanoPagina>(20)
const agrupadoPorMes = ref(false)

function nombreCategoria(idCategoria: number): string {
  return (
    tiendaCategorias.categorias.find((c) => c.categoria.id === idCategoria)?.categoria.nombre ?? ''
  )
}

function nombreSubcategoria(idSubcategoria: number | null): string {
  if (idSubcategoria === null) return ''
  for (const c of tiendaCategorias.categorias) {
    const sub = c.subcategorias.find((s) => s.id === idSubcategoria)
    if (sub) return sub.nombre
  }
  return ''
}

function compararTexto(a: string, b: string): number {
  return a.localeCompare(b)
}

const eventos = computed(() => tienda.eventos)

const { busqueda, filasFiltradas } = useBusquedaTabla(eventos, (e: ProximoEvento) => [
  formatearFecha(e.fecha_prevista),
  e.descripcion,
  nombreCategoria(e.categoria_id),
  nombreSubcategoria(e.subcategoria_id),
  e.importe_estimado,
  NOMBRE_PERIODICIDAD[e.periodicidad],
])

const { campo, direccion, ordenarPor, filasOrdenadas } = useOrdenacionTabla(filasFiltradas, {
  fecha_prevista: (a: ProximoEvento, b: ProximoEvento) =>
    a.fecha_prevista.localeCompare(b.fecha_prevista),
  descripcion: (a: ProximoEvento, b: ProximoEvento) => a.descripcion.localeCompare(b.descripcion),
  categoria_id: (a: ProximoEvento, b: ProximoEvento) =>
    compararTexto(nombreCategoria(a.categoria_id), nombreCategoria(b.categoria_id)),
  subcategoria_id: (a: ProximoEvento, b: ProximoEvento) =>
    compararTexto(nombreSubcategoria(a.subcategoria_id), nombreSubcategoria(b.subcategoria_id)),
  importe_estimado: (a: ProximoEvento, b: ProximoEvento) =>
    Number(a.importe_estimado) - Number(b.importe_estimado),
  periodicidad: (a: ProximoEvento, b: ProximoEvento) =>
    compararTexto(NOMBRE_PERIODICIDAD[a.periodicidad], NOMBRE_PERIODICIDAD[b.periodicidad]),
})

const {
  paginaActual,
  totalPaginas,
  filasPagina,
  totalRegistros,
  primerIndice,
  ultimoIndice,
  paginaSiguiente,
  paginaAnterior,
} = usePaginacionTabla(filasOrdenadas, tamanoPagina)

onMounted(async () => {
  await Promise.all([tiendaCategorias.cargar(), tienda.cargar()])
})

function pasosTour(): DriveStep[] {
  const pasos: DriveStep[] = [
    {
      element: '[data-tour="notificaciones-buscar"]',
      popover: {
        title: 'Buscar',
        description: 'Filtra las notificaciones por descripción, categoría o periodicidad.',
      },
    },
    {
      element: '[data-tour="notificaciones-agrupar"]',
      popover: {
        title: 'Agrupar por mes',
        description:
          'Alterna entre ver todas las notificaciones en una tabla o agrupadas por el mes de su próxima fecha, con el total de gastos e ingresos previstos de cada mes.',
      },
    },
    {
      element: '[data-tour="notificaciones-tabla"]',
      popover: {
        title: 'Próximos eventos',
        description:
          'Gastos e ingresos recurrentes detectados a partir de tu histórico de movimientos de los últimos dos años (solo de categorías seguidas en Resumen Anual). Ordena por columnas pulsando su cabecera.',
      },
    },
  ]

  // La barra de paginación solo se renderiza con más de una página (ver su
  // v-if en la plantilla): si este paso se incluyera siempre, con pocas
  // notificaciones (el caso normal) driver.js se lo saltaría por no
  // encontrar el elemento, y el contador de progreso saltaría de un paso a
  // otro sin mostrar el intermedio.
  if (!agrupadoPorMes.value && totalPaginas.value > 1) {
    pasos.push({
      element: '[data-tour="notificaciones-paginacion"]',
      popover: {
        title: 'Paginación',
        description: 'Navega entre páginas si hay muchas notificaciones.',
      },
    })
  }

  return pasos
}

useRegistrarTourPagina({ pasos: pasosTour })
</script>

<template>
  <section>
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Notificaciones</h2>
    </div>

    <p v-if="tienda.error" class="text-destructive mt-4 text-sm" role="alert">
      {{ tienda.error }}
    </p>

    <p
      v-else-if="!tienda.cargando && tienda.eventos.length === 0"
      class="text-muted-foreground mt-4 text-sm"
    >
      No se ha detectado ningún cargo o ingreso recurrente todavía. Hacen falta al menos dos
      movimientos con la misma descripción, dentro de una categoría seguida en Resumen Anual, y una
      periodicidad regular (mensual, trimestral, semestral o anual) para poder predecir la próxima
      fecha.
    </p>

    <div v-else class="bg-muted/40 mt-4 flex flex-col gap-4 rounded-lg border p-4">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="flex max-w-xs flex-col gap-1.5" data-tour="notificaciones-buscar">
          <Label for="buscar-notificaciones">Buscar</Label>
          <div class="relative">
            <Search
              class="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4"
            />
            <Input
              id="buscar-notificaciones"
              v-model="busqueda"
              placeholder="Buscar notificaciones…"
              class="pl-8"
            />
          </div>
        </div>
        <div class="flex items-center gap-3">
          <SelectorTamanoPagina
            v-if="!agrupadoPorMes"
            v-model="tamanoPagina"
            id-base="notificaciones"
          />
          <p v-if="!agrupadoPorMes" class="text-muted-foreground text-sm">
            Mostrando {{ primerIndice }}–{{ ultimoIndice }} de {{ totalRegistros }} notificaciones
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-tour="notificaciones-agrupar"
            @click="agrupadoPorMes = !agrupadoPorMes"
          >
            <Layers class="size-4" />
            {{ agrupadoPorMes ? 'Ver todas las notificaciones' : 'Agrupar por mes' }}
          </Button>
        </div>
      </div>

      <TablaNotificacionesAgrupadaPorMes
        v-if="agrupadoPorMes"
        :eventos="filasFiltradas"
        class="mt-4"
      />

      <Table v-else class="table-fixed" data-tour="notificaciones-tabla">
        <TableHeader>
          <TableRow>
            <TableHead class="w-[14%] whitespace-normal">
              <CabeceraOrdenable
                :icono="CalendarDays"
                color-icono="text-blue-500"
                :activo="campo === 'fecha_prevista'"
                :direccion="direccion"
                @ordenar="ordenarPor('fecha_prevista')"
                >Próxima fecha</CabeceraOrdenable
              >
            </TableHead>
            <TableHead class="w-[27%] whitespace-normal">
              <CabeceraOrdenable
                :icono="FileText"
                color-icono="text-slate-500"
                :activo="campo === 'descripcion'"
                :direccion="direccion"
                @ordenar="ordenarPor('descripcion')"
                >Descripción</CabeceraOrdenable
              >
            </TableHead>
            <TableHead class="w-[15%] whitespace-normal">
              <CabeceraOrdenable
                :icono="Tag"
                color-icono="text-violet-500"
                :activo="campo === 'categoria_id'"
                :direccion="direccion"
                @ordenar="ordenarPor('categoria_id')"
                >Categoría</CabeceraOrdenable
              >
            </TableHead>
            <TableHead class="w-[15%] whitespace-normal">
              <CabeceraOrdenable
                :icono="Tags"
                color-icono="text-rose-500"
                :activo="campo === 'subcategoria_id'"
                :direccion="direccion"
                @ordenar="ordenarPor('subcategoria_id')"
                >Subcategoría</CabeceraOrdenable
              >
            </TableHead>
            <TableHead class="w-[14%] whitespace-normal">
              <CabeceraOrdenable
                :icono="Euro"
                color-icono="text-amber-500"
                :activo="campo === 'importe_estimado'"
                :direccion="direccion"
                @ordenar="ordenarPor('importe_estimado')"
                >Importe estimado</CabeceraOrdenable
              >
            </TableHead>
            <TableHead class="w-[15%] whitespace-normal">
              <CabeceraOrdenable
                :icono="Repeat"
                color-icono="text-teal-500"
                :activo="campo === 'periodicidad'"
                :direccion="direccion"
                @ordenar="ordenarPor('periodicidad')"
                >Periodicidad</CabeceraOrdenable
              >
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="evento in filasPagina"
            :key="`${evento.descripcion}-${evento.fecha_prevista}`"
          >
            <TableCell>{{ formatearFecha(evento.fecha_prevista) }}</TableCell>
            <TableCell class="truncate" :title="evento.descripcion">{{
              evento.descripcion
            }}</TableCell>
            <TableCell class="truncate" :title="nombreCategoria(evento.categoria_id)">{{
              nombreCategoria(evento.categoria_id)
            }}</TableCell>
            <TableCell class="truncate" :title="nombreSubcategoria(evento.subcategoria_id)">{{
              nombreSubcategoria(evento.subcategoria_id)
            }}</TableCell>
            <TableCell :class="claseColorImporte(evento.importe_estimado)">{{
              formatearImporte(evento.importe_estimado)
            }}</TableCell>
            <TableCell>
              <Badge :class="COLOR_PERIODICIDAD[evento.periodicidad]" variant="outline">
                {{ NOMBRE_PERIODICIDAD[evento.periodicidad] }}
              </Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <BarraPaginacion
        v-if="!agrupadoPorMes && totalPaginas > 1"
        data-tour="notificaciones-paginacion"
        :pagina-actual="paginaActual"
        :total-paginas="totalPaginas"
        @anterior="paginaAnterior"
        @siguiente="paginaSiguiente"
      />
    </div>
  </section>
</template>
