<script setup lang="ts">
import { AlertDialogCancel, type AlertDialogCancelProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { variantesBoton } from '@/componentes/ui/button'

const props = defineProps<AlertDialogCancelProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: clase, ...delegated } = props
  void clase
  return delegated
})
</script>

<template>
  <AlertDialogCancel
    v-bind="delegatedProps"
    :class="cn(variantesBoton({ variant: 'outline' }), props.class)"
  >
    <slot />
  </AlertDialogCancel>
</template>
