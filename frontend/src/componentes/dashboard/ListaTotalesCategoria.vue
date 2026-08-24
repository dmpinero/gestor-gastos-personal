<script setup lang="ts">
import { computed } from 'vue'
import type { TotalCategoria } from '@/api/tipos'
import { formatearImporte } from '@/lib/formato'
import { cn } from '@/lib/utils'

const props = defineProps<{
  titulo: string
  items: TotalCategoria[]
  acento: 'gasto' | 'ingreso'
  mensajeVacio: string
  // Descripción de cada movimiento que compone el total de una categoría
  // (p. ej. "Pago en PELUQUERIA LAS ROZAS DE ES: -45,00 €"), para mostrarla
  // en el title al pasar el ratón. Opcional: si no se indica para una
  // categoría, el title cae de vuelta al nombre y el importe agregado.
  descripcionesPorCategoria?: Record<number, string[]>
}>()

const maximo = computed(() =>
  Math.max(1, ...props.items.map((item) => Math.abs(Number(item.total)))),
)

function anchoPorcentaje(total: string): number {
  return (Math.abs(Number(total)) / maximo.value) * 100
}

function tituloDe(item: TotalCategoria): string {
  const descripciones = props.descripcionesPorCategoria?.[item.categoria_id]
  if (descripciones && descripciones.length > 0) return descripciones.join('\n')
  return `${item.nombre}: ${formatearImporte(item.total)}`
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
      </li>
    </ul>
  </div>
</template>
