<script setup lang="ts">
import { Upload } from '@lucide/vue'
import { ref } from 'vue'
import { cn } from '@/lib/utils'

defineProps<{ ficheroSeleccionado: File | null }>()
const emit = defineEmits<{ 'fichero-elegido': [File] }>()

const inputRef = ref<HTMLInputElement | null>(null)
const enDragover = ref(false)

function abrirSelector(): void {
  inputRef.value?.click()
}

function manejarCambio(evento: Event): void {
  const input = evento.target as HTMLInputElement
  const fichero = input.files?.[0]
  if (fichero) emit('fichero-elegido', fichero)
}

function manejarSoltar(evento: DragEvent): void {
  enDragover.value = false
  const fichero = evento.dataTransfer?.files?.[0]
  if (fichero) emit('fichero-elegido', fichero)
}
</script>

<template>
  <div>
    <div
      role="button"
      tabindex="0"
      aria-label="Seleccionar o soltar archivo Excel"
      :data-dragover="enDragover"
      :class="
        cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
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
        {{
          ficheroSeleccionado
            ? ficheroSeleccionado.name
            : 'Arrastra tu Excel aquí o haz click para seleccionarlo'
        }}
      </p>
    </div>
    <!-- Fuera del elemento con role="button" para no anidar controles interactivos
         (violación de accesibilidad "nested-interactive"); sigue siendo el
         objetivo de abrirSelector() y de Playwright setInputFiles(). -->
    <input
      ref="inputRef"
      type="file"
      accept=".xls,.xlsx"
      tabindex="-1"
      aria-hidden="true"
      class="sr-only"
      @change="manejarCambio"
    />
  </div>
</template>
