<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'
import type { FilaResumenAnual, Periodicidad } from '@/api/tipos'
import { formatearImporte } from '@/lib/formato'
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

defineProps<{
  titulo: string
  filas: FilaResumenAnual[]
  totales: string[]
  mensajeVacio: string
}>()

const emit = defineEmits<{
  editar: [conceptoId: number]
  eliminar: [conceptoId: number]
}>()
</script>

<template>
  <section>
    <h3 class="text-lg font-semibold">{{ titulo }}</h3>
    <p v-if="filas.length === 0" class="text-muted-foreground mt-2 text-sm">{{ mensajeVacio }}</p>
    <div v-else class="mt-2 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concepto</TableHead>
            <TableHead v-for="mes in MESES_CORTOS" :key="mes" class="text-right">{{
              mes
            }}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="fila in filas" :key="fila.concepto_id">
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
              :class="
                valor.es_previsto
                  ? 'text-right tabular-nums text-muted-foreground italic'
                  : 'text-right tabular-nums'
              "
            >
              {{ formatearImporte(valor.importe) }}
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
