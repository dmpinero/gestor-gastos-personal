<script setup lang="ts">
import {
  ProgressIndicator,
  ProgressRoot,
  type ProgressRootEmits,
  type ProgressRootProps,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ProgressRootEmits>()

const delegatedProps = computed(() => {
  const { class: clase, ...delegated } = props
  void clase
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const porcentaje = computed(() => {
  const valor = props.modelValue ?? 0
  const maximo = props.max ?? 100
  return maximo > 0 ? Math.min(100, Math.max(0, (valor / maximo) * 100)) : 0
})
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    v-bind="forwarded"
    :class="cn('bg-muted relative h-2 w-full overflow-hidden rounded-full', props.class)"
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      class="bg-primary h-full w-full flex-1 transition-all"
      :style="{ transform: `translateX(-${100 - porcentaje}%)` }"
    />
  </ProgressRoot>
</template>
