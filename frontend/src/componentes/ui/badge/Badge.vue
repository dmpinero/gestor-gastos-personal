<script setup lang="ts">
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { type VariantesBadge, variantesBadge } from '.'
import { cn } from '@/lib/utils'

interface PropiedadesBadge extends PrimitiveProps {
  variant?: VariantesBadge['variant']
  class?: string
}

const props = withDefaults(defineProps<PropiedadesBadge>(), {
  as: 'span',
})
</script>

<template>
  <Primitive :as="as" :as-child="asChild" :class="cn(variantesBadge({ variant }), props.class)">
    <slot />
  </Primitive>
</template>
