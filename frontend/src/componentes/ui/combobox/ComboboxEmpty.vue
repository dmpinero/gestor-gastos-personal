<script setup lang="ts">
import { ComboboxEmpty, type ComboboxEmptyProps, useForwardProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ComboboxEmptyProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: clase, ...delegated } = props
  void clase
  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxEmpty
    data-slot="combobox-empty"
    v-bind="forwardedProps"
    :class="cn('text-muted-foreground py-4 text-center text-sm', props.class)"
  >
    <slot />
  </ComboboxEmpty>
</template>
