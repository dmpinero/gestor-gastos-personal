<script setup lang="ts">
import { computed } from 'vue'
import type { TamanoPagina } from '@/composables/usePaginacionTabla'
import { Label } from '@/componentes/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/ui/select'

const props = defineProps<{
  modelValue: TamanoPagina
  idBase: string
}>()

const emit = defineEmits<{
  'update:modelValue': [valor: TamanoPagina]
}>()

const valorTexto = computed({
  get: () => String(props.modelValue),
  set: (valor: string) =>
    emit('update:modelValue', valor === 'todas' ? 'todas' : (Number(valor) as TamanoPagina)),
})
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <Label :id="`etiqueta-${idBase}-tamano-pagina`" :for="`selector-${idBase}-tamano-pagina`">
      Elementos por página
    </Label>
    <Select v-model="valorTexto">
      <SelectTrigger
        :id="`selector-${idBase}-tamano-pagina`"
        :aria-labelledby="`etiqueta-${idBase}-tamano-pagina`"
        class="w-28"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="10">10</SelectItem>
        <SelectItem value="20">20</SelectItem>
        <SelectItem value="50">50</SelectItem>
        <SelectItem value="todas">Todas</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
