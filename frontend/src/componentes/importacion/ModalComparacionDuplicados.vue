<script setup lang="ts">
import { Pencil } from '@lucide/vue'
import { ref, watch } from 'vue'
import type { DuplicadoDetectado, Movimiento } from '@/api/tipos'
import PanelEdicionMovimiento from '@/componentes/compartido/PanelEdicionMovimiento.vue'
import { Button } from '@/componentes/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/componentes/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'
import { formatearFecha, formatearImporte } from '@/lib/formato'
import { useTiendaCategorias } from '@/stores/categorias'

const props = defineProps<{
  nombreFichero: string
  duplicados: DuplicadoDetectado[]
}>()

const tiendaCategorias = useTiendaCategorias()
const panelEdicion = ref<InstanceType<typeof PanelEdicionMovimiento> | null>(null)

// Copia local editable: props.duplicados es un snapshot puntual de la
// importación (no ligado al store), así que tras editar un "Ya existía" se
// actualiza aquí para reflejarlo al instante, en vez de mutar la prop.
const duplicadosLocales = ref<DuplicadoDetectado[]>([...props.duplicados])
watch(
  () => props.duplicados,
  (nuevos) => {
    duplicadosLocales.value = [...nuevos]
  },
)

let indiceEnEdicion = -1

function editar(indice: number, movimiento: Movimiento): void {
  indiceEnEdicion = indice
  panelEdicion.value?.abrirParaEditar(movimiento)
}

function alGuardar(movimiento: Movimiento): void {
  if (indiceEnEdicion === -1) return
  const duplicado = duplicadosLocales.value[indiceEnEdicion]
  if (duplicado) duplicado.movimiento_existente = movimiento
  indiceEnEdicion = -1
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
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline" size="sm">Ver duplicados ({{ duplicados.length }})</Button>
    </DialogTrigger>
    <DialogContent class="flex max-h-[85vh] max-w-4xl flex-col">
      <DialogHeader class="shrink-0">
        <DialogTitle>Movimientos omitidos por duplicado</DialogTitle>
        <DialogDescription>
          {{ nombreFichero }}: {{ duplicados.length }} movimiento{{
            duplicados.length === 1 ? '' : 's'
          }}
          omitido{{ duplicados.length === 1 ? '' : 's' }} por coincidir con uno ya existente.
        </DialogDescription>
      </DialogHeader>
      <PanelEdicionMovimiento ref="panelEdicion" @guardado="alGuardar" />
      <div class="min-h-0 flex-1 space-y-6 overflow-auto">
        <div
          v-for="(duplicado, indice) in duplicadosLocales"
          :key="indice"
          class="rounded-lg border p-3"
        >
          <Table class="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead class="w-[11%] whitespace-normal">Origen</TableHead>
                <TableHead class="w-[10%] whitespace-normal">Fecha</TableHead>
                <TableHead class="w-[14%] whitespace-normal">Categoría</TableHead>
                <TableHead class="w-[14%] whitespace-normal">Subcategoría</TableHead>
                <TableHead class="w-[25%] whitespace-normal">Descripción</TableHead>
                <TableHead class="w-[9%] text-right whitespace-normal">Importe</TableHead>
                <TableHead class="w-[9%] text-right whitespace-normal">Saldo</TableHead>
                <TableHead class="w-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="truncate font-medium">Este fichero</TableCell>
                <TableCell>{{ formatearFecha(duplicado.fila_excel.fecha_valor) }}</TableCell>
                <TableCell class="truncate" :title="duplicado.fila_excel.categoria">{{
                  duplicado.fila_excel.categoria
                }}</TableCell>
                <TableCell class="truncate" :title="duplicado.fila_excel.subcategoria ?? ''">{{
                  duplicado.fila_excel.subcategoria ?? ''
                }}</TableCell>
                <TableCell class="truncate" :title="duplicado.fila_excel.descripcion">{{
                  duplicado.fila_excel.descripcion
                }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  formatearImporte(duplicado.fila_excel.importe)
                }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  formatearImporte(duplicado.fila_excel.saldo)
                }}</TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="truncate font-medium">Ya existía</TableCell>
                <TableCell>{{
                  formatearFecha(duplicado.movimiento_existente.fecha_valor)
                }}</TableCell>
                <TableCell
                  class="truncate"
                  :title="nombreCategoria(duplicado.movimiento_existente.categoria_id)"
                  >{{ nombreCategoria(duplicado.movimiento_existente.categoria_id) }}</TableCell
                >
                <TableCell
                  class="truncate"
                  :title="nombreSubcategoria(duplicado.movimiento_existente.subcategoria_id)"
                  >{{
                    nombreSubcategoria(duplicado.movimiento_existente.subcategoria_id)
                  }}</TableCell
                >
                <TableCell class="truncate" :title="duplicado.movimiento_existente.descripcion">{{
                  duplicado.movimiento_existente.descripcion
                }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  formatearImporte(duplicado.movimiento_existente.importe)
                }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  formatearImporte(duplicado.movimiento_existente.saldo)
                }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar"
                    @click="editar(indice, duplicado.movimiento_existente)"
                  >
                    <Pencil class="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
