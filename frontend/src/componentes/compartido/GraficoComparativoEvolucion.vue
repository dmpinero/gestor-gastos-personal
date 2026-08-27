<script setup lang="ts">
import { AreaChart, BarChart3, ChevronRight, LineChart, PieChart } from '@lucide/vue'
import { computed, ref } from 'vue'
import { claseColorImporte, formatearImporte, formatearPeriodo } from '@/lib/formato'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/componentes/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'
import type { TotalPeriodo } from './GraficoEvolucion.vue'

const props = defineProps<{
  itemsGastos: TotalPeriodo[]
  itemsIngresos: TotalPeriodo[]
}>()

const modo = ref<'barras' | 'lineas' | 'area' | 'circular'>('barras')
const tablaSaldoAbierta = ref(true)

// Solo aplica a los modos líneas/área: en barras y circular siempre se ven
// gasto e ingreso (no hay línea de saldo que ocultar).
type Serie = 'gasto' | 'ingreso' | 'saldo'
const seriesVisibles = ref<Set<Serie>>(new Set(['gasto', 'ingreso', 'saldo']))
function alternarSerie(serie: Serie): void {
  const nuevo = new Set(seriesVisibles.value)
  if (nuevo.has(serie)) nuevo.delete(serie)
  else nuevo.add(serie)
  seriesVisibles.value = nuevo
}

function totalPara(items: TotalPeriodo[], periodo: string): number {
  return items.find((item) => item.periodo === periodo)?.total ?? 0
}

// Unión de periodos de ambas series (un periodo con solo gastos o solo
// ingresos también debe aparecer, con la otra serie a 0).
const filas = computed(() => {
  const periodos = new Set([
    ...props.itemsGastos.map((item) => item.periodo),
    ...props.itemsIngresos.map((item) => item.periodo),
  ])
  return [...periodos]
    .sort((a, b) => a.localeCompare(b))
    .map((periodo) => {
      const gasto = totalPara(props.itemsGastos, periodo)
      const ingreso = totalPara(props.itemsIngresos, periodo)
      // gasto llega como magnitud positiva (Math.abs ya aplicado por quien
      // llama), no como importe negativo: el saldo es ingreso menos gasto.
      return { periodo, gasto, ingreso, saldo: ingreso - gasto }
    })
})

const maximo = computed(() =>
  Math.max(1, ...filas.value.flatMap((fila) => [fila.gasto, fila.ingreso])),
)

function alturaPorcentaje(total: number): number {
  return (total / maximo.value) * 100
}

const ANCHO_PUNTO = 64
const ALTO_GRAFICO = 128
// Deja hueco arriba (y, en líneas/área, también abajo) para que el punto en
// el valor máximo no quede recortado contra el borde del SVG.
const MARGEN_SUPERIOR = 24

const anchoTotal = computed(() => filas.value.length * ANCHO_PUNTO)

// Eje exclusivo de los modos líneas/área: a diferencia de las barras (que
// solo manejan magnitudes ≥ 0), aquí conviven gasto/ingreso (≥ 0) con el
// saldo (puede ser negativo), así que el dominio es simétrico [-máx, +máx]
// con el cero en el centro vertical. Solo cuenta el máximo de las series
// actualmente visibles, para que el eje se reajuste al ocultar alguna.
const CENTRO_GRAFICO = ALTO_GRAFICO / 2

const maximoLineas = computed(() => {
  const valores = filas.value.flatMap((fila) => [
    seriesVisibles.value.has('gasto') ? fila.gasto : 0,
    seriesVisibles.value.has('ingreso') ? fila.ingreso : 0,
    seriesVisibles.value.has('saldo') ? Math.abs(fila.saldo) : 0,
  ])
  return Math.max(1, ...valores)
})

// |saldo| = |ingreso - gasto| ≤ max(ingreso, gasto) siempre que ambos sean
// ≥ 0, así que el saldo nunca se sale del rango ya acotado por gasto/ingreso.
function coordenadaYLineas(total: number): number {
  return CENTRO_GRAFICO - (total / maximoLineas.value) * (CENTRO_GRAFICO - MARGEN_SUPERIOR)
}

function puntosDe(valores: (fila: (typeof filas.value)[number]) => number) {
  return filas.value.map((fila, indice) => ({
    periodo: fila.periodo,
    total: valores(fila),
    x: indice * ANCHO_PUNTO + ANCHO_PUNTO / 2,
    y: coordenadaYLineas(valores(fila)),
  }))
}

// El gasto se traza en negativo (como el saldo cuando es negativo): así
// queda por debajo del eje cero, igual que un importe de gasto real, en vez
// de aparecer "hacia arriba" como si fuera un ingreso más.
const puntosGastoLineas = computed(() => puntosDe((fila) => -fila.gasto))
const puntosIngresoLineas = computed(() => puntosDe((fila) => fila.ingreso))
const puntosSaldoLineas = computed(() => puntosDe((fila) => fila.saldo))

function lineaDe(puntos: { x: number; y: number }[]): string {
  return puntos.map((p) => `${p.x},${p.y}`).join(' ')
}
const lineaGasto = computed(() => lineaDe(puntosGastoLineas.value))
const lineaIngreso = computed(() => lineaDe(puntosIngresoLineas.value))
const lineaSaldo = computed(() => lineaDe(puntosSaldoLineas.value))

// El área se cierra contra la línea de cero (no contra el borde inferior):
// así una serie que baja de cero (el saldo) se rellena correctamente por
// debajo del cero en vez de "colgar" hacia el borde del gráfico. Se cierra
// contra los bordes izquierdo/derecho, no contra el primer/último punto,
// porque con un único periodo ambos coinciden y el polígono tendría ancho 0.
function areaDe(linea: string): string {
  if (filas.value.length === 0) return ''
  return `0,${CENTRO_GRAFICO} ${linea} ${anchoTotal.value},${CENTRO_GRAFICO}`
}
const areaGasto = computed(() => areaDe(lineaGasto.value))
const areaIngreso = computed(() => areaDe(lineaIngreso.value))
const areaSaldo = computed(() => areaDe(lineaSaldo.value))

const descripcionAccesible = computed(() =>
  filas.value
    .map(
      (fila) =>
        `${formatearPeriodo(fila.periodo)}: gastos ${formatearImporte(fila.gasto)}, ingresos ${formatearImporte(fila.ingreso)}, saldo ${formatearImporte(fila.saldo)}`,
    )
    .join(', '),
)

const RADIO_CIRCULO = 60
const CENTRO_CIRCULO = 64

// Ángulo 0° = arriba (12 en punto), creciente en sentido horario.
function coordenadasEnCirculo(anguloGrados: number): { x: number; y: number } {
  const rad = (anguloGrados * Math.PI) / 180
  return {
    x: CENTRO_CIRCULO + RADIO_CIRCULO * Math.sin(rad),
    y: CENTRO_CIRCULO - RADIO_CIRCULO * Math.cos(rad),
  }
}

function trazoSector(anguloInicio: number, anguloFin: number): string {
  const inicio = coordenadasEnCirculo(anguloInicio)
  const fin = coordenadasEnCirculo(anguloFin)
  const arcoGrande = anguloFin - anguloInicio > 180 ? 1 : 0
  return `M ${CENTRO_CIRCULO} ${CENTRO_CIRCULO} L ${inicio.x} ${inicio.y} A ${RADIO_CIRCULO} ${RADIO_CIRCULO} 0 ${arcoGrande} 1 ${fin.x} ${fin.y} Z`
}

const totalGastoGeneral = computed(() =>
  props.itemsGastos.reduce((acc, item) => acc + item.total, 0),
)
const totalIngresoGeneral = computed(() =>
  props.itemsIngresos.reduce((acc, item) => acc + item.total, 0),
)
const totalGeneralCircular = computed(() => totalGastoGeneral.value + totalIngresoGeneral.value)

// Con una sola parte (todo gasto o todo ingreso) se dibuja un círculo
// completo aparte: un arco de 360° degenera, su punto de inicio y de fin
// coinciden.
const partesCirculares = computed(() =>
  [
    { etiqueta: 'Gastos', total: totalGastoGeneral.value, color: 'var(--destructive)' },
    { etiqueta: 'Ingresos', total: totalIngresoGeneral.value, color: 'var(--success)' },
  ].filter((parte) => parte.total > 0),
)

const sectoresComparativos = computed(() => {
  if (totalGeneralCircular.value <= 0 || partesCirculares.value.length < 2) return []
  let anguloAcumulado = 0
  return partesCirculares.value.map((parte) => {
    const anguloInicio = anguloAcumulado
    const anguloFin = anguloAcumulado + (parte.total / totalGeneralCircular.value) * 360
    anguloAcumulado = anguloFin
    return {
      ...parte,
      trazo: trazoSector(anguloInicio, anguloFin),
      porcentaje: parte.total / totalGeneralCircular.value,
    }
  })
})
</script>

<template>
  <div v-if="filas.length > 0">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div v-if="modo === 'lineas' || modo === 'area'" class="flex items-center gap-4 text-xs">
        <button
          type="button"
          class="flex items-center gap-1.5"
          :class="!seriesVisibles.has('gasto') && 'opacity-40'"
          :aria-pressed="seriesVisibles.has('gasto')"
          :aria-label="seriesVisibles.has('gasto') ? 'Ocultar gastos' : 'Mostrar gastos'"
          @click="alternarSerie('gasto')"
        >
          <span class="bg-destructive inline-block size-2.5 rounded-full" />
          Gastos
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5"
          :class="!seriesVisibles.has('ingreso') && 'opacity-40'"
          :aria-pressed="seriesVisibles.has('ingreso')"
          :aria-label="seriesVisibles.has('ingreso') ? 'Ocultar ingresos' : 'Mostrar ingresos'"
          @click="alternarSerie('ingreso')"
        >
          <span class="bg-success inline-block size-2.5 rounded-full" />
          Ingresos
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5"
          :class="!seriesVisibles.has('saldo') && 'opacity-40'"
          :aria-pressed="seriesVisibles.has('saldo')"
          :aria-label="seriesVisibles.has('saldo') ? 'Ocultar saldo' : 'Mostrar saldo'"
          @click="alternarSerie('saldo')"
        >
          <span class="bg-teal-500 inline-block size-2.5 rounded-full" />
          Saldo
        </button>
      </div>
      <div v-else class="flex items-center gap-4 text-xs">
        <span class="flex items-center gap-1.5">
          <span class="bg-destructive inline-block size-2.5 rounded-full" />
          Gastos
        </span>
        <span class="flex items-center gap-1.5">
          <span class="bg-success inline-block size-2.5 rounded-full" />
          Ingresos
        </span>
      </div>
      <div class="inline-flex gap-0.5 rounded-md border p-0.5">
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
        <button
          type="button"
          aria-label="Ver como circular"
          :aria-pressed="modo === 'circular'"
          :class="[
            'flex size-7 items-center justify-center rounded-sm',
            modo === 'circular' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
          ]"
          @click="modo = 'circular'"
        >
          <PieChart class="size-4" />
        </button>
      </div>
    </div>

    <div
      v-if="modo === 'barras'"
      class="flex items-end gap-4 overflow-x-auto pb-1"
      tabindex="0"
      role="group"
      :aria-label="`Evolución comparada: ${descripcionAccesible}`"
    >
      <div
        v-for="fila in filas"
        :key="fila.periodo"
        class="flex min-w-16 shrink-0 flex-col items-center gap-1"
      >
        <div class="flex items-end gap-1">
          <div class="flex flex-col items-center gap-1">
            <span class="text-destructive text-xs whitespace-nowrap tabular-nums">{{
              formatearImporte(fila.gasto)
            }}</span>
            <div class="bg-muted flex h-32 w-4 items-end overflow-hidden rounded-t-md">
              <div
                class="bg-destructive w-full rounded-t-md transition-all"
                :style="{ height: `${alturaPorcentaje(fila.gasto)}%` }"
              />
            </div>
          </div>
          <div class="flex flex-col items-center gap-1">
            <span
              class="text-success dark:text-emerald-500 text-xs whitespace-nowrap tabular-nums"
              >{{ formatearImporte(fila.ingreso) }}</span
            >
            <div class="bg-muted flex h-32 w-4 items-end overflow-hidden rounded-t-md">
              <div
                class="bg-success w-full rounded-t-md transition-all"
                :style="{ height: `${alturaPorcentaje(fila.ingreso)}%` }"
              />
            </div>
          </div>
        </div>
        <span class="text-muted-foreground text-xs whitespace-nowrap capitalize">{{
          formatearPeriodo(fila.periodo)
        }}</span>
      </div>
    </div>

    <div v-else-if="modo === 'circular'" class="flex flex-wrap items-center gap-4">
      <svg
        viewBox="0 0 128 128"
        width="128"
        height="128"
        role="img"
        :aria-label="`Comparativa: gastos ${formatearImporte(totalGastoGeneral)}, ingresos ${formatearImporte(totalIngresoGeneral)}`"
      >
        <circle
          v-if="partesCirculares.length === 1"
          :cx="CENTRO_CIRCULO"
          :cy="CENTRO_CIRCULO"
          :r="RADIO_CIRCULO"
          :fill="partesCirculares[0]?.color"
        />
        <path
          v-for="sector in sectoresComparativos"
          :key="sector.etiqueta"
          :d="sector.trazo"
          :fill="sector.color"
        />
      </svg>
      <ul class="flex flex-col gap-1">
        <li
          v-for="parte in partesCirculares"
          :key="parte.etiqueta"
          class="text-muted-foreground flex items-center gap-2 text-xs whitespace-nowrap"
        >
          <span>{{ parte.etiqueta }}</span>
          <span class="tabular-nums">{{ formatearImporte(parte.total) }}</span>
          <span class="tabular-nums"
            >({{
              totalGeneralCircular > 0 ? Math.round((parte.total / totalGeneralCircular) * 100) : 0
            }}%)</span
          >
        </li>
      </ul>
    </div>

    <div v-else class="overflow-x-auto pb-1" tabindex="0" role="group">
      <svg
        :viewBox="`0 0 ${anchoTotal} ${ALTO_GRAFICO}`"
        :width="anchoTotal"
        :height="ALTO_GRAFICO"
        role="img"
        :aria-label="`Evolución comparada: ${descripcionAccesible}`"
      >
        <line
          x1="0"
          :x2="anchoTotal"
          :y1="CENTRO_GRAFICO"
          :y2="CENTRO_GRAFICO"
          stroke="var(--muted-foreground)"
          stroke-opacity="0.3"
          stroke-dasharray="4 4"
        />
        <polygon
          v-if="modo === 'area' && seriesVisibles.has('gasto')"
          :points="areaGasto"
          fill="var(--destructive)"
          fill-opacity="0.15"
        />
        <polygon
          v-if="modo === 'area' && seriesVisibles.has('ingreso')"
          :points="areaIngreso"
          fill="var(--success)"
          fill-opacity="0.15"
        />
        <polygon
          v-if="modo === 'area' && seriesVisibles.has('saldo')"
          :points="areaSaldo"
          class="fill-teal-500"
          fill-opacity="0.15"
        />
        <polyline
          v-if="seriesVisibles.has('gasto')"
          :points="lineaGasto"
          fill="none"
          stroke="var(--destructive)"
          stroke-width="2"
        />
        <polyline
          v-if="seriesVisibles.has('ingreso')"
          :points="lineaIngreso"
          fill="none"
          stroke="var(--success)"
          stroke-width="2"
        />
        <polyline
          v-if="seriesVisibles.has('saldo')"
          :points="lineaSaldo"
          fill="none"
          class="stroke-teal-500"
          stroke-width="2"
        />
        <template v-if="seriesVisibles.has('gasto')">
          <template v-for="punto in puntosGastoLineas" :key="`gasto-${punto.periodo}`">
            <text
              :x="punto.x"
              :y="Math.min(punto.y + 10, ALTO_GRAFICO - 4)"
              text-anchor="middle"
              font-size="10"
              fill="var(--muted-foreground)"
            >
              {{ formatearImporte(punto.total) }}
            </text>
            <circle :cx="punto.x" :cy="punto.y" r="4" fill="var(--destructive)" />
          </template>
        </template>
        <template v-if="seriesVisibles.has('ingreso')">
          <template v-for="punto in puntosIngresoLineas" :key="`ingreso-${punto.periodo}`">
            <text
              :x="punto.x"
              :y="Math.max(punto.y - 8, 10)"
              text-anchor="middle"
              font-size="10"
              fill="var(--muted-foreground)"
            >
              {{ formatearImporte(punto.total) }}
            </text>
            <circle :cx="punto.x" :cy="punto.y" r="4" fill="var(--success)" />
          </template>
        </template>
        <template v-if="seriesVisibles.has('saldo')">
          <template v-for="punto in puntosSaldoLineas" :key="`saldo-${punto.periodo}`">
            <text
              :x="punto.x"
              :y="Math.min(punto.y + 20, ALTO_GRAFICO - 4)"
              text-anchor="middle"
              font-size="10"
              fill="var(--muted-foreground)"
            >
              {{ formatearImporte(punto.total) }}
            </text>
            <circle :cx="punto.x" :cy="punto.y" r="4" class="fill-teal-500" />
          </template>
        </template>
      </svg>
      <div class="flex" :style="{ width: `${anchoTotal}px` }">
        <span
          v-for="fila in filas"
          :key="fila.periodo"
          class="text-muted-foreground shrink-0 truncate px-1 text-center text-xs capitalize"
          :style="{ width: `${ANCHO_PUNTO}px` }"
        >
          {{ formatearPeriodo(fila.periodo) }}
        </span>
      </div>
    </div>

    <Collapsible v-if="modo !== 'circular'" v-model:open="tablaSaldoAbierta" class="mt-4">
      <CollapsibleTrigger
        class="text-muted-foreground flex items-center gap-1 text-sm font-medium"
        :aria-label="tablaSaldoAbierta ? 'Contraer saldo por mes' : 'Expandir saldo por mes'"
      >
        <ChevronRight
          class="size-4 transition-transform"
          :class="tablaSaldoAbierta ? 'rotate-90' : ''"
        />
        Saldo por mes
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Table class="mt-2 w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead class="w-1/2 whitespace-normal">Periodo</TableHead>
              <TableHead class="w-1/2 text-right whitespace-normal">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="fila in filas" :key="fila.periodo">
              <TableCell class="capitalize">{{ formatearPeriodo(fila.periodo) }}</TableCell>
              <TableCell class="text-right tabular-nums" :class="claseColorImporte(fila.saldo)">{{
                formatearImporte(fila.saldo)
              }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>
