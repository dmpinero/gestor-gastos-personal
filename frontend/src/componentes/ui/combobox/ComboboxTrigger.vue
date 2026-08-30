<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { ComboboxAnchor, ComboboxTrigger } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class']; size?: 'sm' | 'default' }>()
</script>

<template>
  <ComboboxAnchor
    data-slot="combobox-trigger"
    :data-size="size ?? 'default'"
    :class="
      cn(
        `border-input data-[placeholder]:text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive data-[size=default]:h-9 data-[size=sm]:h-8 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50`,
        props.class,
      )
    "
  >
    <slot />
    <ComboboxTrigger class="text-muted-foreground shrink-0" aria-label="Mostrar opciones">
      <ChevronDown class="size-4 opacity-50" />
    </ComboboxTrigger>
  </ComboboxAnchor>
</template>
