<script setup lang="ts">
import { FileType } from '@lucide/vue'

defineProps<{ origen?: string | null }>()
</script>

<template>
  <FileType
    v-if="origen === 'pdf'"
    class="size-3.5 shrink-0 text-red-500"
    role="img"
    aria-label="Importado desde un PDF"
    title="Importado desde un PDF"
  />
</template>
