<script setup lang="ts">
import { Button } from '@/componentes/ui/button'

defineProps<{
  paginaActual: number
  totalPaginas: number
}>()

const emit = defineEmits<{
  anterior: []
  siguiente: []
}>()
</script>

<template>
  <div class="mt-4 flex items-center justify-end gap-3">
    <Button variant="outline" size="sm" :disabled="paginaActual <= 1" @click="emit('anterior')">
      Anterior
    </Button>
    <span class="text-muted-foreground text-sm"
      >Página {{ paginaActual }} de {{ totalPaginas }}</span
    >
    <Button
      variant="outline"
      size="sm"
      :disabled="paginaActual >= totalPaginas"
      @click="emit('siguiente')"
    >
      Siguiente
    </Button>
  </div>
</template>
