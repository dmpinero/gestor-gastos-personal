<script setup lang="ts">
import { ChevronDown, ChevronUp, ChevronsUpDown, type LucideIcon } from '@lucide/vue'
import { computed } from 'vue'
import type { Direccion } from '@/composables/useOrdenacionTabla'

const props = defineProps<{
  icono: LucideIcon
  colorIcono: string
  activo: boolean
  direccion: Direccion
}>()

const emit = defineEmits<{ ordenar: [] }>()

const iconoOrden = computed(() => {
  if (!props.activo) return ChevronsUpDown
  return props.direccion === 'asc' ? ChevronUp : ChevronDown
})
</script>

<template>
  <button
    type="button"
    class="hover:text-foreground flex items-center gap-1.5"
    @click="emit('ordenar')"
  >
    <component :is="icono" :class="[colorIcono, 'size-3.5 shrink-0']" />
    <span><slot /></span>
    <component :is="iconoOrden" class="text-muted-foreground size-3.5 shrink-0" />
  </button>
</template>
