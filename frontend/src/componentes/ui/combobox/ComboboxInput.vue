<script setup lang="ts">
import { ComboboxInput, type ComboboxInputProps, useForwardProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ComboboxInputProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: clase, ...delegated } = props
  void clase
  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxInput
    data-slot="combobox-input"
    v-bind="{ ...forwardedProps, ...$attrs }"
    :class="
      cn(
        'placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
