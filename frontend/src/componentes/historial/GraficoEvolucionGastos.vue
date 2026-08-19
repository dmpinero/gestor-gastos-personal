<script setup lang="ts">
import { AreaChart, BarChart3, LineChart } from '@lucide/vue'
import { computed, ref } from 'vue'
import { formatearImporte, formatearPeriodo } from '@/lib/formato'

export interface TotalPeriodo {
  periodo: string
  total: number
}

const props = defineProps<{
  items: TotalPeriodo[]
}>()

const modo = ref<'barras' | 'lineas' | 'area'>('barras')

const maximo = computed(() => Math.max(1, ...props.items.map((item) => item.total)))

function alturaPorcentaje(total: number): number {
  return (total / maximo.value) * 100
}

const ANCHO_PUNTO = 64
const ALTO_GRAFICO = 128
// Deja hueco arriba para la etiqueta del importe y el punto en el valor máximo,
// que si no quedarían recortados contra el borde superior del SVG.
const MARGEN_SUPERIOR = 24

// Ancho fijo por punto (igual que cada barra) para que la fila de etiquetas
// de periodo, debajo del SVG, quede exactamente alineada bajo cada punto.
const puntos = computed(() =>
  props.items.map((item, indice) => ({
    ...item,
    x: indice * ANCHO_PUNTO + ANCHO_PUNTO / 2,
    y: ALTO_GRAFICO - (alturaPorcentaje(item.total) / 100) * (ALTO_GRAFICO - MARGEN_SUPERIOR),
  })),
)

const puntosLinea = computed(() => puntos.value.map((p) => `${p.x},${p.y}`).join(' '))
const anchoTotal = computed(() => props.items.length * ANCHO_PUNTO)

// El área se cierra contra los bordes izquierdo y derecho del gráfico (no
// contra el primer/último punto): con un único periodo, el primer y último
// punto coinciden y un polígono "punto a punto" tendría ancho cero.
const puntosArea = computed(() => {
  if (puntos.value.length === 0) return ''
  return `0,${ALTO_GRAFICO} ${puntosLinea.value} ${anchoTotal.value},${ALTO_GRAFICO}`
})

const descripcionAccesible = computed(() =>
  props.items
    .map((item) => `${formatearPeriodo(item.periodo)}: ${formatearImporte(item.total)}`)
    .join(', '),
)
</script>

<template>
  <div v-if="items.length > 0">
    <div class="mb-3 inline-flex gap-0.5 rounded-md border p-0.5">
      <button
        type="button"
        aria-label="Ver como barras"
        :aria-pressed="modo === 'barras'"
        :class="[
          'flex size-7 items-center justify-center rounded-sm',
          modo === 'barras' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        ]"
        @click="modo = 'barras'"
      >
        <BarChart3 class="size-4" />
      </button>
      <button
        type="button"
        aria-label="Ver como líneas"
        :aria-pressed="modo === 'lineas'"
        :class="[
          'flex size-7 items-center justify-center rounded-sm',
          modo === 'lineas' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        ]"
        @click="modo = 'lineas'"
      >
        <LineChart class="size-4" />
      </button>
      <button
        type="button"
        aria-label="Ver como área"
        :aria-pressed="modo === 'area'"
        :class="[
          'flex size-7 items-center justify-center rounded-sm',
          modo === 'area' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        ]"
        @click="modo = 'area'"
      >
        <AreaChart class="size-4" />
      </button>
    </div>

    <div v-if="modo === 'barras'" class="flex items-end gap-4 overflow-x-auto pb-1">
      <div
        v-for="item in items"
        :key="item.periodo"
        class="flex min-w-16 shrink-0 flex-col items-center gap-1"
      >
        <span class="text-muted-foreground text-xs tabular-nums">{{
          formatearImporte(item.total)
        }}</span>
        <div class="bg-muted flex h-32 w-8 items-end overflow-hidden rounded-t-md">
          <div
            class="bg-destructive w-full rounded-t-md transition-all"
            :style="{ height: `${alturaPorcentaje(item.total)}%` }"
          />
        </div>
        <span class="text-muted-foreground text-xs whitespace-nowrap capitalize">{{
          formatearPeriodo(item.periodo)
        }}</span>
      </div>
    </div>

    <div v-else class="overflow-x-auto pb-1">
      <svg
        :viewBox="`0 0 ${anchoTotal} ${ALTO_GRAFICO}`"
        :width="anchoTotal"
        :height="ALTO_GRAFICO"
        role="img"
        :aria-label="`Evolución: ${descripcionAccesible}`"
      >
        <polygon
          v-if="modo === 'area'"
          :points="puntosArea"
          fill="var(--destructive)"
          fill-opacity="0.15"
        />
        <polyline :points="puntosLinea" fill="none" stroke="var(--destructive)" stroke-width="2" />
        <template v-for="punto in puntos" :key="punto.periodo">
          <text
            :x="punto.x"
            :y="Math.max(punto.y - 8, 10)"
            text-anchor="middle"
            font-size="10"
            fill="var(--muted-foreground)"
          >
            {{ formatearImporte(punto.total) }}
          </text>
          <circle :cx="punto.x" :cy="punto.y" r="4" fill="var(--destructive)" />
        </template>
      </svg>
      <div class="flex" :style="{ width: `${anchoTotal}px` }">
        <span
          v-for="item in items"
          :key="item.periodo"
          class="text-muted-foreground shrink-0 truncate px-1 text-center text-xs capitalize"
          :style="{ width: `${ANCHO_PUNTO}px` }"
        >
          {{ formatearPeriodo(item.periodo) }}
        </span>
      </div>
    </div>
  </div>
</template>
