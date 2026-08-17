<script setup lang="ts">
import { AlertDialogAction, type AlertDialogActionProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { variantesBoton } from '@/componentes/ui/button'

const props = defineProps<AlertDialogActionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: clase, ...delegated } = props
  void clase
  return delegated
})
</script>

<template>
  <AlertDialogAction v-bind="delegatedProps" :class="cn(variantesBoton(), props.class)">
    <slot />
  </AlertDialogAction>
</template>
