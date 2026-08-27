<script setup lang="ts">
import { Check, Copy } from '@lucide/vue'
import { ref } from 'vue'

const props = defineProps<{ valor: string }>()

const copiado = ref(false)

async function copiar(): Promise<void> {
  await navigator.clipboard.writeText(props.valor)
  copiado.value = true
  setTimeout(() => {
    copiado.value = false
  }, 2000)
}
</script>

<template>
  <button
    type="button"
    class="text-muted-foreground hover:text-foreground shrink-0"
    :aria-label="`Copiar importe ${valor}`"
    @click="copiar"
  >
    <Check v-if="copiado" class="text-success size-3.5" />
    <Copy v-else class="size-3.5" />
  </button>
</template>
