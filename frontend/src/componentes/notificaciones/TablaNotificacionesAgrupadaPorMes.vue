<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed, ref } from 'vue'

import type { Periodicidad, ProximoEvento } from '@/api/tipos'
import {
  claseColorImporte,
  formatearFecha,
  formatearImporte,
  formatearPeriodo,
} from '@/lib/formato'
import { agruparProximosEventosPorMes } from '@/lib/notificacionesPorMes'
import { useTiendaCategorias } from '@/stores/categorias'
import { Badge } from '@/componentes/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'

const props = defineProps<{ eventos: ProximoEvento[] }>()

const tiendaCategorias = useTiendaCategorias()

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

const grupos = computed(() => agruparProximosEventosPorMes(props.eventos))

const hayGastos = computed(() => props.eventos.some((e) => Number(e.importe_estimado) < 0))
const hayIngresos = computed(() => props.eventos.some((e) => Number(e.importe_estimado) > 0))

const mesesAbiertos = ref<Set<string>>(new Set())

function alternarMes(periodo: string): void {
  const nuevo = new Set(mesesAbiertos.value)
  if (nuevo.has(periodo)) nuevo.delete(periodo)
  else nuevo.add(periodo)
  mesesAbiertos.value = nuevo
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <p v-if="grupos.length === 0" class="text-muted-foreground text-sm">No hay notificaciones.</p>

    <div v-for="grupo in grupos" :key="grupo.periodo" class="overflow-hidden rounded-lg border">
      <button
        type="button"
        class="hover:bg-muted/50 flex w-full items-center gap-3 p-2 text-left"
        :aria-expanded="mesesAbiertos.has(grupo.periodo)"
        @click="alternarMes(grupo.periodo)"
      >
        <ChevronRight
          class="size-4 shrink-0 transition-transform"
          :class="mesesAbiertos.has(grupo.periodo) ? 'rotate-90' : ''"
        />
        <span class="flex-1 truncate font-medium capitalize">{{
          formatearPeriodo(grupo.periodo)
        }}</span>
        <span
          v-if="hayGastos"
          class="text-destructive w-28 shrink-0 text-right text-sm tabular-nums"
          >{{ formatearImporte(grupo.totalGastado) }}</span
        >
        <span
          v-if="hayIngresos"
          class="text-success w-28 shrink-0 text-right text-sm tabular-nums dark:text-emerald-500"
          >{{ formatearImporte(grupo.totalIngresado) }}</span
        >
        <span class="text-muted-foreground w-28 shrink-0 text-right text-sm"
          >{{ grupo.eventos.length }} notif.</span
        >
      </button>

      <Table v-if="mesesAbiertos.has(grupo.periodo)" class="table-fixed border-t">
        <TableHeader>
          <TableRow>
            <TableHead class="w-[14%] whitespace-normal">Próxima fecha</TableHead>
            <TableHead class="w-[28%] whitespace-normal">Descripción</TableHead>
            <TableHead class="w-[16%] whitespace-normal">Categoría</TableHead>
            <TableHead class="w-[16%] whitespace-normal">Subcategoría</TableHead>
            <TableHead class="w-[13%] whitespace-normal">Importe estimado</TableHead>
            <TableHead class="w-[13%] whitespace-normal">Periodicidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="evento in grupo.eventos"
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
    </div>
  </div>
</template>
