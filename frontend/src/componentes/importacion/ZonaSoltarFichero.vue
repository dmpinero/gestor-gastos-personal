<script setup lang="ts">
import { Upload } from '@lucide/vue'
import { ref } from 'vue'
import { cn } from '@/lib/utils'

defineProps<{ ficherosSeleccionados: File[] }>()
const emit = defineEmits<{ 'ficheros-elegidos': [File[]] }>()

const inputRef = ref<HTMLInputElement | null>(null)
const enDragover = ref(false)

function abrirSelector(): void {
  inputRef.value?.click()
}

function manejarCambio(evento: Event): void {
  const input = evento.target as HTMLInputElement
  const ficheros = Array.from(input.files ?? [])
  if (ficheros.length > 0) emit('ficheros-elegidos', ficheros)
}

function manejarSoltar(evento: DragEvent): void {
  enDragover.value = false
  const ficheros = Array.from(evento.dataTransfer?.files ?? [])
  if (ficheros.length > 0) emit('ficheros-elegidos', ficheros)
}
</script>

<template>
  <div class="w-full">
    <div
      role="button"
      tabindex="0"
      aria-label="Seleccionar o soltar uno o varios archivos Excel"
      :data-dragover="enDragover"
      :class="
        cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          enDragover ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50',
        )
      "
      @click="abrirSelector"
      @keydown.enter.prevent="abrirSelector"
      @keydown.space.prevent="abrirSelector"
      @dragenter.prevent="enDragover = true"
      @dragover.prevent="enDragover = true"
      @dragleave.prevent="enDragover = false"
      @drop.prevent="manejarSoltar"
    >
      <Upload class="size-6 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        Arrastra uno o varios ficheros Excel aquí o haz click para seleccionarlos
      </p>
      <ul v-if="ficherosSeleccionados.length > 0" class="mt-2 text-sm">
        <li v-for="fichero in ficherosSeleccionados" :key="fichero.name">{{ fichero.name }}</li>
      </ul>
    </div>
    <!-- Fuera del elemento con role="button" para no anidar controles interactivos
         (violación de accesibilidad "nested-interactive"); sigue siendo el
         objetivo de abrirSelector() y de Playwright setInputFiles(). -->
    <input
      ref="inputRef"
      type="file"
      accept=".xls,.xlsx"
      multiple
      tabindex="-1"
      aria-hidden="true"
      class="sr-only"
      @change="manejarCambio"
    />
  </div>
</template>
