<script setup lang="ts">
import { FileSpreadsheet, FileText } from '@lucide/vue'
import { exportarTablaExcel, exportarTablaPDF } from '@/lib/exportarTabla'
import { Button } from '@/componentes/ui/button'

// Botones de exportar reutilizables para cualquier tabla de la aplicación:
// reciben ya las columnas y filas a exportar (normalmente las mismas que se
// ven en pantalla) y delegan la generación del fichero en lib/exportarTabla.
const props = defineProps<{
  nombreFichero: string
  titulo: string
  columnas: string[]
  filas: (string | number)[][]
}>()

async function exportarExcel(): Promise<void> {
  await exportarTablaExcel(`${props.nombreFichero}.xlsx`, props.columnas, props.filas)
}

async function exportarPdf(): Promise<void> {
  await exportarTablaPDF(`${props.nombreFichero}.pdf`, props.titulo, props.columnas, props.filas)
}
</script>

<template>
  <div class="flex items-center gap-1">
    <Button
      variant="ghost"
      size="icon"
      aria-label="Exportar a Excel"
      title="Exportar a Excel"
      @click="exportarExcel"
    >
      <FileSpreadsheet class="size-4 text-green-600 dark:text-green-500" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      aria-label="Exportar a PDF"
      title="Exportar a PDF"
      @click="exportarPdf"
    >
      <FileText class="size-4 text-red-600 dark:text-red-500" />
    </Button>
  </div>
</template>
