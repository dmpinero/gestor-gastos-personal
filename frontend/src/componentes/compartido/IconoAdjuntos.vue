<script setup lang="ts">
import { Paperclip } from '@lucide/vue'

const props = defineProps<{ cantidad: number }>()
</script>

<template>
  <span
    v-if="props.cantidad > 0"
    class="text-muted-foreground inline-flex shrink-0 items-center gap-0.5"
    role="img"
    :aria-label="`${props.cantidad} ${props.cantidad === 1 ? 'adjunto' : 'adjuntos'}`"
    :title="`${props.cantidad} ${props.cantidad === 1 ? 'adjunto' : 'adjuntos'}`"
  >
    <Paperclip class="size-3.5" />
    <span class="text-xs tabular-nums">{{ props.cantidad }}</span>
  </span>
</template>
