<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pencil, Tag, Trash2 } from '@lucide/vue'
import type { FilaResumenAnual, OrigenValorMensual, Periodicidad } from '@/api/tipos'
import { claseColorImporte, formatearImporte } from '@/lib/formato'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import CabeceraOrdenable from '@/componentes/compartido/CabeceraOrdenable.vue'
import DialogoConfirmarEliminacion from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'
import { Badge } from '@/componentes/ui/badge'
import { Button } from '@/componentes/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'

const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

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

const props = defineProps<{
  titulo: string
  filas: FilaResumenAnual[]
  totales: string[]
  mensajeVacio: string
}>()

const emit = defineEmits<{
  editar: [conceptoId: number]
  eliminar: [conceptoId: number]
  'editar-celda': [conceptoId: number, mes: number, importe: string | null]
}>()

// Solo "Concepto" es un campo realmente ordenable en este listado: los
// meses son columnas fijas en su orden natural (Ene-Dic), no campos por los
// que tenga sentido reordenar filas.
const { campo, direccion, ordenarPor, filasOrdenadas } = useOrdenacionTabla(
  computed(() => props.filas),
  {
    nombre: (a: FilaResumenAnual, b: FilaResumenAnual) => a.nombre.localeCompare(b.nombre),
  },
)

const celdaEditando = ref<{ conceptoId: number; mes: number } | null>(null)
const valorEdicion = ref('')

function estaEditando(conceptoId: number, mes: number): boolean {
  return celdaEditando.value?.conceptoId === conceptoId && celdaEditando.value?.mes === mes
}

function empezarEdicion(conceptoId: number, mes: number, importeActual: string): void {
  celdaEditando.value = { conceptoId, mes }
  valorEdicion.value = importeActual
}

function confirmarEdicion(): void {
  if (!celdaEditando.value) return
  const { conceptoId, mes } = celdaEditando.value
  const texto = valorEdicion.value.trim()
  emit('editar-celda', conceptoId, mes, texto === '' ? null : texto)
  celdaEditando.value = null
}

function cancelarEdicion(): void {
  celdaEditando.value = null
}

// Los valores "previsto" se muestran atenuados a propósito para distinguirlos
// de los confirmados; no se colorean en verde/rojo para no perder ese matiz.
function claseCelda(origen: OrigenValorMensual, importe: string): string {
  const base = 'p-0 text-right tabular-nums'
  if (origen === 'previsto') return `${base} text-muted-foreground italic`
  if (origen === 'ajustado') {
    return `${base} border-b-2 border-dashed border-amber-500 ${claseColorImporte(importe)}`
  }
  return `${base} ${claseColorImporte(importe)}`
}
</script>

<template>
  <section>
    <h3 class="text-lg font-semibold">{{ titulo }}</h3>
    <p v-if="filas.length === 0" class="text-muted-foreground mt-2 text-sm">{{ mensajeVacio }}</p>
    <div v-else class="mt-2 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <CabeceraOrdenable
                :icono="Tag"
                color-icono="text-violet-500"
                :activo="campo === 'nombre'"
                :direccion="direccion"
                @ordenar="ordenarPor('nombre')"
                >Concepto</CabeceraOrdenable
              >
            </TableHead>
            <TableHead v-for="mes in MESES_CORTOS" :key="mes" class="text-right">{{
              mes
            }}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="fila in filasOrdenadas" :key="fila.concepto_id">
            <TableCell>
              <div class="flex items-center gap-2">
                <span>{{ fila.nombre }}</span>
                <Badge :class="COLOR_PERIODICIDAD[fila.periodicidad]" variant="outline">
                  {{ NOMBRE_PERIODICIDAD[fila.periodicidad] }}
                </Badge>
              </div>
            </TableCell>
            <TableCell
              v-for="valor in fila.valores"
              :key="valor.mes"
              :class="claseCelda(valor.origen, valor.importe)"
            >
              <input
                v-if="estaEditando(fila.concepto_id, valor.mes)"
                :value="valorEdicion"
                type="text"
                autofocus
                class="w-full bg-transparent px-2 py-2 text-right outline-none"
                :aria-label="`Importe de ${MESES_CORTOS[valor.mes - 1]} para ${fila.nombre}`"
                @input="valorEdicion = ($event.target as HTMLInputElement).value"
                @keydown.enter="confirmarEdicion()"
                @keydown.escape="cancelarEdicion()"
                @blur="confirmarEdicion()"
              />
              <button
                v-else
                type="button"
                class="hover:bg-muted/50 w-full px-2 py-2 text-right"
                @click="empezarEdicion(fila.concepto_id, valor.mes, valor.importe)"
              >
                {{ formatearImporte(valor.importe) }}
              </button>
            </TableCell>
            <TableCell class="text-right whitespace-nowrap">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                @click="emit('editar', fila.concepto_id)"
              >
                <Pencil class="size-4" />
              </Button>
              <DialogoConfirmarEliminacion
                :descripcion="`el concepto previsto ${fila.nombre}`"
                @confirmar="emit('eliminar', fila.concepto_id)"
              >
                <template #disparador>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-destructive"
                    aria-label="Eliminar"
                  >
                    <Trash2 class="size-4" />
                  </Button>
                </template>
              </DialogoConfirmarEliminacion>
            </TableCell>
          </TableRow>
          <TableRow class="font-semibold">
            <TableCell>Total</TableCell>
            <TableCell
              v-for="(total, indice) in totales"
              :key="indice"
              class="text-right tabular-nums"
              :class="claseColorImporte(total)"
            >
              {{ formatearImporte(total) }}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </section>
</template>
