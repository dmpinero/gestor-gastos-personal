<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'

const props = defineProps<{
  label: string
  idBase: string
  min: string
  max: string
}>()

const emit = defineEmits<{
  'update:min': [valor: string]
  'update:max': [valor: string]
}>()

// El <Input type="number"> de Vue castea el v-model a Number en tiempo de
// ejecución aunque el tipo declarado sea string (comportamiento nativo de
// Vue para inputs numéricos); se normaliza aquí para mantener el contrato
// de string usado en toda la app para importe/saldo ('' = sin límite).
const minProxy = computed({
  get: () => props.min,
  set: (valor: string | number) => emit('update:min', String(valor)),
})
const maxProxy = computed({
  get: () => props.max,
  set: (valor: string | number) => emit('update:max', String(valor)),
})
</script>

<template>
  <div class="flex items-end gap-2">
    <div class="flex w-28 flex-col gap-1.5">
      <Label :for="`${idBase}-min`">{{ label }} mínimo</Label>
      <Input :id="`${idBase}-min`" v-model="minProxy" type="number" step="any" />
    </div>
    <div class="flex w-28 flex-col gap-1.5">
      <Label :for="`${idBase}-max`">{{ label }} máximo</Label>
      <Input :id="`${idBase}-max`" v-model="maxProxy" type="number" step="any" />
    </div>
  </div>
</template>
