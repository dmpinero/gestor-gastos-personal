<script setup lang="ts">
import { ref } from 'vue'
import type { ResumenImportacionDatosCompletos } from '@/api/tipos'
import { useTiendaExportacion } from '@/stores/exportacion'
import DialogoDetalleError from '@/componentes/compartido/DialogoDetalleError.vue'
import ZonaSoltarFichero from '@/componentes/importacion/ZonaSoltarFichero.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/componentes/ui/alert-dialog'
import { Button } from '@/componentes/ui/button'

const tienda = useTiendaExportacion()

const ficherosSeleccionados = ref<File[]>([])
const confirmacionAbierta = ref(false)
const importando = ref(false)
const resumen = ref<ResumenImportacionDatosCompletos | null>(null)

function onFicherosElegidos(ficheros: File[]): void {
  // Un backup es un único fichero consolidado: si se sueltan varios, solo se
  // usa el primero.
  ficherosSeleccionados.value = ficheros.slice(0, 1)
  resumen.value = null
  tienda.error = null
}

async function importar(): Promise<void> {
  const fichero = ficherosSeleccionados.value[0]
  if (!fichero) return

  confirmacionAbierta.value = false
  importando.value = true
  resumen.value = await tienda.importarDatosCompletos(fichero)
  importando.value = false
}

function irAlDashboard(): void {
  // Recarga completa (no router.push): el reemplazo total de datos deja
  // obsoleto el estado de todas las tiendas Pinia (categorías, dashboard...).
  window.location.href = '/'
}
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold">Importar backup</h2>
    <p class="text-muted-foreground mt-2 max-w-prose">
      Sube un backup exportado previamente desde "Realizar backup".
      <strong>Se borrará toda la información actual</strong> (cuentas, categorías, subcategorías,
      movimientos, conceptos previstos, ajustes mensuales y asociaciones de conceptos) y se
      sustituirá por la del fichero.
    </p>

    <form class="mt-4 flex flex-col items-start gap-3" @submit.prevent="confirmacionAbierta = true">
      <ZonaSoltarFichero
        :ficheros-seleccionados="ficherosSeleccionados"
        etiqueta="fichero de backup"
        accept=".xlsx"
        class="w-full"
        @ficheros-elegidos="onFicherosElegidos"
      />
      <Button
        type="submit"
        variant="destructive"
        :disabled="ficherosSeleccionados.length === 0 || importando"
      >
        {{ importando ? 'Importando…' : 'Importar' }}
      </Button>
    </form>

    <AlertDialog v-model:open="confirmacionAbierta">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Importar este backup?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borrará TODA la información almacenada actualmente en la aplicación y se sustituirá
            por la del fichero "{{ ficherosSeleccionados[0]?.name }}". Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction @click="importar">Importar</AlertDialogAction>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <div v-if="tienda.error" class="mt-4 text-sm text-destructive" role="alert">
      {{ tienda.error }}
      <DialogoDetalleError :mensaje="tienda.error" :traza="tienda.errorTraza" />
    </div>

    <div v-if="resumen" class="mt-6 rounded-lg border p-4" data-test="resumen-importacion-backup">
      <h3 class="font-medium">Backup restaurado</h3>
      <ul class="mt-2 text-sm">
        <li>Cuentas: {{ resumen.cuentas_importadas }}</li>
        <li>Categorías: {{ resumen.categorias_importadas }}</li>
        <li>Subcategorías: {{ resumen.subcategorias_importadas }}</li>
        <li>Movimientos: {{ resumen.movimientos_importados }}</li>
        <li>Conceptos previstos: {{ resumen.conceptos_previstos_importados }}</li>
        <li>Ajustes mensuales: {{ resumen.ajustes_importados }}</li>
        <li>Asociaciones de conceptos: {{ resumen.asociaciones_importadas }}</li>
      </ul>

      <Button class="mt-4" variant="outline" @click="irAlDashboard"> Ir al Dashboard </Button>
    </div>
  </section>
</template>
