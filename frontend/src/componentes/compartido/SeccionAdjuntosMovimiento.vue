<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Paperclip } from '@lucide/vue'

import { urlRecurso } from '@/api/cliente'
import { formatearFecha } from '@/lib/formato'
import { useTiendaAdjuntos } from '@/stores/adjuntos'
import DialogoConfirmarEliminacion from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'
import ZonaSoltarFichero from '@/componentes/importacion/ZonaSoltarFichero.vue'
import { Button } from '@/componentes/ui/button'
import { Label } from '@/componentes/ui/label'

const props = defineProps<{ movimientoId: number }>()

const tienda = useTiendaAdjuntos()
const ficherosSeleccionados = ref<File[]>([])

function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function alElegirFicheros(ficheros: File[]): void {
  ficherosSeleccionados.value = ficheros
}

async function subir(): Promise<void> {
  for (const fichero of ficherosSeleccionados.value) {
    await tienda.subir(props.movimientoId, fichero)
  }
  ficherosSeleccionados.value = []
}

async function eliminar(idAdjunto: number): Promise<void> {
  await tienda.eliminar(idAdjunto, props.movimientoId)
}

onMounted(() => {
  tienda.cargarDeMovimiento(props.movimientoId)
})
</script>

<template>
  <div class="flex flex-col gap-2 border-t pt-4">
    <Label class="flex items-center gap-1.5">
      <Paperclip class="size-4" />
      Adjuntos
    </Label>

    <p v-if="tienda.error" class="text-destructive text-sm" role="alert">{{ tienda.error }}</p>

    <ul
      v-if="(tienda.adjuntosPorMovimiento[movimientoId]?.length ?? 0) > 0"
      class="flex flex-col gap-1.5"
    >
      <li
        v-for="adjunto in tienda.adjuntosPorMovimiento[movimientoId]"
        :key="adjunto.id"
        class="bg-muted/40 flex items-center gap-2 rounded-md border p-2 text-sm"
      >
        <a
          :href="urlRecurso(`/adjuntos/${adjunto.id}/ver`)"
          target="_blank"
          rel="noopener"
          class="min-w-0 flex-1 truncate underline-offset-2 hover:underline"
          :title="adjunto.nombre_original"
          >{{ adjunto.nombre_original }}</a
        >
        <span class="text-muted-foreground shrink-0 text-xs">{{
          formatearTamanio(adjunto.tamanio_bytes)
        }}</span>
        <span class="text-muted-foreground shrink-0 text-xs">{{
          formatearFecha(adjunto.fecha_subida.slice(0, 10))
        }}</span>
        <DialogoConfirmarEliminacion
          :descripcion="`el adjunto ${adjunto.nombre_original}`"
          @confirmar="eliminar(adjunto.id)"
        />
      </li>
    </ul>
    <p v-else-if="!tienda.cargando" class="text-muted-foreground text-sm">
      Todavía no hay ningún adjunto.
    </p>

    <ZonaSoltarFichero
      :ficheros-seleccionados="ficherosSeleccionados"
      etiqueta="el archivo adjunto"
      accept=""
      @ficheros-elegidos="alElegirFicheros"
    />
    <Button
      v-if="ficherosSeleccionados.length > 0"
      type="button"
      size="sm"
      class="self-start"
      @click="subir"
      >Subir {{ ficherosSeleccionados.length }} fichero{{
        ficherosSeleccionados.length === 1 ? '' : 's'
      }}</Button
    >
  </div>
</template>
