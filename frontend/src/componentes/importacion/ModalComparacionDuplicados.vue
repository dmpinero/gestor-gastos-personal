<script setup lang="ts">
import type { DuplicadoDetectado } from '@/api/tipos'
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
      <div class="min-h-0 flex-1 space-y-6 overflow-auto">
        <div
          v-for="(duplicado, indice) in props.duplicados"
          :key="indice"
          class="rounded-lg border p-3"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origen</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Subcategoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead class="text-right">Importe</TableHead>
                <TableHead class="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell class="font-medium">Este fichero</TableCell>
                <TableCell>{{ formatearFecha(duplicado.fila_excel.fecha_valor) }}</TableCell>
                <TableCell>{{ duplicado.fila_excel.categoria }}</TableCell>
                <TableCell>{{ duplicado.fila_excel.subcategoria ?? '' }}</TableCell>
                <TableCell>{{ duplicado.fila_excel.descripcion }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  formatearImporte(duplicado.fila_excel.importe)
                }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  formatearImporte(duplicado.fila_excel.saldo)
                }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">Ya existía</TableCell>
                <TableCell>{{
                  formatearFecha(duplicado.movimiento_existente.fecha_valor)
                }}</TableCell>
                <TableCell>{{
                  nombreCategoria(duplicado.movimiento_existente.categoria_id)
                }}</TableCell>
                <TableCell>{{
                  nombreSubcategoria(duplicado.movimiento_existente.subcategoria_id)
                }}</TableCell>
                <TableCell>{{ duplicado.movimiento_existente.descripcion }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  formatearImporte(duplicado.movimiento_existente.importe)
                }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  formatearImporte(duplicado.movimiento_existente.saldo)
                }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
