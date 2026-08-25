<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, ChevronUp, ChevronsUpDown } from '@lucide/vue'
import { compararCeldas } from '@/lib/compararCeldas'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/componentes/ui/alert-dialog'
import { Button } from '@/componentes/ui/button'
import BotonesExportarTabla from './BotonesExportarTabla.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'

export interface Dependencia {
  etiqueta: string
  cantidad: number
}

const props = withDefaults(
  defineProps<{
    descripcion: string
    textoBoton?: string
    obtenerDependencias?: () => Promise<Dependencia[]>
    // Trigger por defecto sólido (botón destructive) en vez de hiperenlace;
    // pensado para acciones de borrado masivo ("Eliminar seleccionados"),
    // donde un simple enlace pasa desapercibido.
    disparadorSolido?: boolean
    // "Ver detalles": modal con la lista completa de registros que se verán
    // afectados por el borrado en cascada (p. ej. los movimientos que se
    // eliminarán junto a una cuenta). Solo se muestra el enlace si se pasan
    // estos tres props y hay al menos una dependencia con cantidad > 0.
    tituloDetalles?: string
    columnasDetalles?: string[]
    obtenerFilasDetalles?: () => Promise<(string | number)[][]>
  }>(),
  { textoBoton: 'Eliminar', disparadorSolido: false },
)
const emit = defineEmits<{ confirmar: [cascada: boolean] }>()

const dependencias = ref<Dependencia[]>([])
const comprobandoDependencias = ref(false)

async function alAbrir(abierto: boolean): Promise<void> {
  if (!abierto || !props.obtenerDependencias) {
    dependencias.value = []
    return
  }
  comprobandoDependencias.value = true
  try {
    dependencias.value = (await props.obtenerDependencias()).filter((d) => d.cantidad > 0)
  } finally {
    comprobandoDependencias.value = false
  }
}

function confirmarBorrado(): void {
  emit('confirmar', dependencias.value.length > 0)
}

const detallesAbiertos = ref(false)
const cargandoDetalles = ref(false)
const filasDetalles = ref<(string | number)[][]>([])

async function abrirDetalles(): Promise<void> {
  if (!props.obtenerFilasDetalles) return
  detallesAbiertos.value = true
  cargandoDetalles.value = true
  try {
    filasDetalles.value = await props.obtenerFilasDetalles()
  } finally {
    cargandoDetalles.value = false
  }
}

// Las columnas de esta tabla varían según quién use el componente (una
// cuenta, una categoría...), así que se ordena de forma genérica por índice
// de columna en vez de por nombre de campo, comparando los valores ya
// formateados con compararCeldas (reconoce fechas e importes es-ES).
const comparadoresPorColumna: Record<
  string,
  (a: (string | number)[], b: (string | number)[]) => number
> = Object.fromEntries(
  (props.columnasDetalles ?? []).map((_, indice) => [
    String(indice),
    (a: (string | number)[], b: (string | number)[]) =>
      compararCeldas(a[indice] ?? '', b[indice] ?? ''),
  ]),
)
const {
  campo: campoDetalles,
  direccion: direccionDetalles,
  ordenarPor: ordenarDetallesPor,
  filasOrdenadas: filasDetallesOrdenadas,
} = useOrdenacionTabla(filasDetalles, comparadoresPorColumna)
</script>

<template>
  <AlertDialog @update:open="alAbrir">
    <AlertDialogTrigger as-child>
      <slot name="disparador">
        <Button
          :variant="disparadorSolido ? 'destructive' : 'link'"
          :class="disparadorSolido ? '' : 'text-destructive'"
          >{{ textoBoton }}</Button
        >
      </slot>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar {{ descripcion }}?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acción no se puede deshacer.
          <template v-if="dependencias.length > 0">
            También se eliminarán:
            {{ dependencias.map((d) => `${d.cantidad} ${d.etiqueta}`).join(', ') }}.
          </template>
        </AlertDialogDescription>
        <Button
          v-if="obtenerFilasDetalles && dependencias.length > 0"
          type="button"
          variant="link"
          class="h-auto w-fit p-0 text-xs"
          @click="abrirDetalles"
          >Ver detalles</Button
        >
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction :disabled="comprobandoDependencias" @click="confirmarBorrado"
          >Eliminar</AlertDialogAction
        >
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <Dialog v-model:open="detallesAbiertos">
    <DialogContent class="max-w-5xl max-h-[85vh] flex flex-col">
      <DialogHeader class="shrink-0">
        <div class="flex items-center justify-between gap-4 pr-6">
          <DialogTitle>{{ tituloDetalles }}</DialogTitle>
          <BotonesExportarTabla
            v-if="!cargandoDetalles"
            :nombre-fichero="tituloDetalles ?? 'Detalles'"
            :titulo="tituloDetalles ?? 'Detalles'"
            :columnas="columnasDetalles ?? []"
            :filas="filasDetallesOrdenadas"
          />
        </div>
        <p v-if="!cargandoDetalles" class="text-muted-foreground text-sm">
          {{ filasDetallesOrdenadas.length }} registro{{
            filasDetallesOrdenadas.length === 1 ? '' : 's'
          }}
        </p>
      </DialogHeader>
      <p v-if="cargandoDetalles" class="text-muted-foreground text-sm">Cargando…</p>
      <div v-else class="min-h-0 flex-1 overflow-auto">
        <Table class="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead
                v-for="(columna, indice) in columnasDetalles"
                :key="columna"
                class="whitespace-normal"
                :style="{ width: `${100 / (columnasDetalles?.length || 1)}%` }"
              >
                <button
                  type="button"
                  class="hover:text-foreground flex w-full min-w-0 items-center gap-1.5"
                  @click="ordenarDetallesPor(String(indice))"
                >
                  <span class="min-w-0 truncate">{{ columna }}</span>
                  <component
                    :is="
                      campoDetalles === String(indice)
                        ? direccionDetalles === 'asc'
                          ? ChevronUp
                          : ChevronDown
                        : ChevronsUpDown
                    "
                    class="text-muted-foreground size-3.5 shrink-0"
                  />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(fila, indice) in filasDetallesOrdenadas" :key="indice">
              <TableCell
                v-for="(valor, indiceColumna) in fila"
                :key="indiceColumna"
                class="truncate"
                :title="String(valor)"
                >{{ valor }}</TableCell
              >
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>
</template>
