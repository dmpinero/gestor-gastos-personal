<script setup lang="ts">
import { Check } from '@lucide/vue'
import {
  ComboboxItem,
  ComboboxItemIndicator,
  type ComboboxItemProps,
  useForwardProps,
} from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ComboboxItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: clase, ...delegated } = props
  void clase
  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxItem
    data-slot="combobox-item"
    v-bind="forwardedProps"
    :class="
      cn(
        `focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
        props.class,
      )
    "
  >
    <span class="absolute right-2 flex size-3.5 items-center justify-center">
      <ComboboxItemIndicator>
        <Check class="size-4" />
      </ComboboxItemIndicator>
    </span>
    <slot />
  </ComboboxItem>
</template>
