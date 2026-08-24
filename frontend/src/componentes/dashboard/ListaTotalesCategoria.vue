<script setup lang="ts">
import { computed } from 'vue'
import type { TotalCategoria } from '@/api/tipos'
import { formatearImporte } from '@/lib/formato'
import { cn } from '@/lib/utils'
import ModalDetalleMovimientos from './ModalDetalleMovimientos.vue'

export interface MovimientoDeCategoria {
  fecha: string
  descripcion: string
  subcategoria: string
  importe: string
}

const props = defineProps<{
  titulo: string
  items: TotalCategoria[]
  acento: 'gasto' | 'ingreso'
  mensajeVacio: string
  // Movimientos que componen el total de cada categoría (id de categoría =>
  // lista, ya ordenada de mayor a menor importe), para el title al pasar el
  // ratón y para la tabla de detalle de la modal "Detalles". Opcional: sin
  // esta información (p. ej. en el Dashboard, que solo tiene el agregado por
  // categoría) el title cae de vuelta al nombre y el importe agregado, y no
  // se muestra el enlace "Detalles".
  movimientosPorCategoria?: Record<number, MovimientoDeCategoria[]>
}>()

const MAXIMO_DESCRIPCIONES_TOOLTIP = 15

const maximo = computed(() =>
  Math.max(1, ...props.items.map((item) => Math.abs(Number(item.total)))),
)

function anchoPorcentaje(total: string): number {
  return (Math.abs(Number(total)) / maximo.value) * 100
}

function movimientosDe(item: TotalCategoria): MovimientoDeCategoria[] {
  return props.movimientosPorCategoria?.[item.categoria_id] ?? []
}

function tituloDe(item: TotalCategoria): string {
  const movimientos = movimientosDe(item)
  if (movimientos.length === 0) return `${item.nombre}: ${formatearImporte(item.total)}`

  const lineas = movimientos
    .slice(0, MAXIMO_DESCRIPCIONES_TOOLTIP)
    .map((m) => `${m.descripcion}: ${formatearImporte(m.importe)}`)
  const restantes = movimientos.length - MAXIMO_DESCRIPCIONES_TOOLTIP
  if (restantes > 0) lineas.push(`… y ${restantes} más`)
  return lineas.join('\n')
}
</script>

<template>
  <div>
    <h3 class="text-muted-foreground text-sm font-medium">{{ titulo }}</h3>
    <p v-if="items.length === 0" class="text-muted-foreground mt-3 text-sm">{{ mensajeVacio }}</p>
    <ul v-else class="mt-3 space-y-2">
      <li
        v-for="item in items"
        :key="item.categoria_id"
        class="flex items-center gap-3"
        :title="tituloDe(item)"
      >
        <span class="w-32 shrink-0 truncate text-sm">{{ item.nombre }}</span>
        <div class="bg-muted h-2 flex-1 rounded-full">
          <div
            :class="cn('h-2 rounded-full', acento === 'gasto' ? 'bg-destructive' : 'bg-success')"
            :style="{ width: `${anchoPorcentaje(item.total)}%` }"
          />
        </div>
        <span
          :class="
            cn(
              'w-24 shrink-0 text-right text-sm font-medium tabular-nums',
              acento === 'gasto' ? 'text-destructive' : 'text-success dark:text-emerald-500',
            )
          "
          >{{ formatearImporte(item.total) }}</span
        >
        <ModalDetalleMovimientos
          v-if="movimientosDe(item).length > 0"
          :nombre-categoria="item.nombre"
          :total="item.total"
          :movimientos="movimientosDe(item)"
        />
      </li>
    </ul>
  </div>
</template>
