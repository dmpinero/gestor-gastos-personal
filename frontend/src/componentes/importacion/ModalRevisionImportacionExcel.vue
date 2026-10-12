<script setup lang="ts">
import { Sparkles } from '@lucide/vue'
import { ref } from 'vue'

import type { AnalisisImportacionExcel, CabeceraExcel, FilaPropuesta } from '@/api/tipos'
import { formatearFecha, formatearImporte } from '@/lib/formato'
import { Button } from '@/componentes/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'

const abierto = ref(false)
const nombreFichero = ref('')
const filas = ref<FilaPropuesta[]>([])
let cabecera: CabeceraExcel = { numero_cuenta: '', titular: null }
let resolver: ((valor: AnalisisImportacionExcel | null) => void) | null = null

/** Abre el modal con la propuesta recibida de /movimientos/importar/analizar
 * y devuelve una promesa que se resuelve cuando el usuario confirma (con las
 * filas ya editadas) o cancela (con null). Pensado para usarse con `await`
 * dentro del bucle que procesa los ficheros seleccionados uno a uno. */
function abrir(
  analisis: AnalisisImportacionExcel,
  nombreFicheroParam: string,
): Promise<AnalisisImportacionExcel | null> {
  cabecera = analisis.cabecera
  nombreFichero.value = nombreFicheroParam
  filas.value = analisis.filas.map((fila) => ({ ...fila }))
  abierto.value = true
  return new Promise((resolve) => {
    resolver = resolve
  })
}

function confirmar(): void {
  abierto.value = false
  resolver?.({ cabecera, filas: filas.value })
  resolver = null
}

function cancelar(): void {
  abierto.value = false
  resolver?.(null)
  resolver = null
}

defineExpose({ abrir })
</script>

<template>
  <Dialog v-model:open="abierto">
    <DialogContent class="flex max-h-[85vh] max-w-6xl flex-col">
      <DialogHeader class="shrink-0">
        <DialogTitle>Revisar categorización antes de importar</DialogTitle>
        <DialogDescription>
          {{ nombreFichero }}: {{ filas.length }} movimiento{{ filas.length === 1 ? '' : 's' }}.
          <span class="inline-flex items-center gap-1">
            <Sparkles class="size-3.5 text-amber-500" /> indica una propuesta automática a partir de
            una asociación por descripción ya configurada; puedes cambiarla antes de confirmar.
          </span>
        </DialogDescription>
      </DialogHeader>

      <div class="min-h-0 flex-1 overflow-auto">
        <Table class="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead class="w-[10%] whitespace-normal">Fecha</TableHead>
              <TableHead class="w-[27%] whitespace-normal">Descripción</TableHead>
              <TableHead class="w-[9%] text-right whitespace-normal">Importe</TableHead>
              <TableHead class="w-[9%] text-right whitespace-normal">Saldo</TableHead>
              <TableHead class="w-[22%] whitespace-normal">Categoría</TableHead>
              <TableHead class="w-[23%] whitespace-normal">Subcategoría</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(fila, indice) in filas" :key="indice">
              <TableCell>{{ formatearFecha(fila.fecha_valor) }}</TableCell>
              <TableCell class="truncate" :title="fila.descripcion">{{
                fila.descripcion
              }}</TableCell>
              <TableCell class="text-right tabular-nums">{{
                formatearImporte(fila.importe)
              }}</TableCell>
              <TableCell class="text-right tabular-nums">{{
                formatearImporte(fila.saldo)
              }}</TableCell>
              <TableCell>
                <Label :for="`categoria-${indice}`" class="sr-only">Categoría</Label>
                <div class="flex items-center gap-1.5">
                  <Sparkles
                    v-if="fila.propuesta_automatica"
                    class="size-3.5 shrink-0 text-amber-500"
                    role="img"
                    :aria-label="`Propuesta automática (Excel: ${fila.categoria_original_excel || '(vacío)'})`"
                    :title="`Propuesta automática (Excel: ${fila.categoria_original_excel || '(vacío)'})`"
                  />
                  <Input :id="`categoria-${indice}`" v-model="fila.categoria" class="h-8" />
                </div>
              </TableCell>
              <TableCell>
                <Label :for="`subcategoria-${indice}`" class="sr-only">Subcategoría</Label>
                <Input
                  :id="`subcategoria-${indice}`"
                  v-model="fila.subcategoria"
                  class="h-8"
                  placeholder="(sin subcategoría)"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div class="flex shrink-0 justify-end gap-2 border-t pt-4">
        <Button type="button" variant="destructive" @click="cancelar">Cancelar</Button>
        <Button type="button" variant="success" @click="confirmar">Confirmar importación</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
