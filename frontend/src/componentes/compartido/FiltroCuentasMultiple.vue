<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { computed } from 'vue'
import type { CuentaBancaria } from '@/api/tipos'
import { Button } from '@/componentes/ui/button'
import { Checkbox } from '@/componentes/ui/checkbox'
import { Label } from '@/componentes/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { Separator } from '@/componentes/ui/separator'

const props = defineProps<{
  cuentas: CuentaBancaria[]
  modelValue: number[]
}>()

const emit = defineEmits<{ 'update:modelValue': [ids: number[]] }>()

const todasSeleccionadas = computed(
  () => props.cuentas.length > 0 && props.modelValue.length === props.cuentas.length,
)

const textoDisparador = computed(() => {
  if (props.cuentas.length === 0 || todasSeleccionadas.value) return 'Todas las cuentas'
  if (props.modelValue.length === 0) return 'Ninguna cuenta'
  if (props.modelValue.length === 1) {
    const cuenta = props.cuentas.find((c) => c.id === props.modelValue[0])
    return cuenta ? (cuenta.alias ?? cuenta.numero_cuenta) : '1 cuenta'
  }
  return `${props.modelValue.length} cuentas`
})

function nombreCuenta(cuenta: CuentaBancaria): string {
  return cuenta.alias ?? cuenta.numero_cuenta
}

function estaSeleccionada(id: number): boolean {
  return props.modelValue.includes(id)
}

function alternarCuenta(id: number, marcada: boolean): void {
  emit(
    'update:modelValue',
    marcada ? [...props.modelValue, id] : props.modelValue.filter((v) => v !== id),
  )
}

function alternarTodas(marcada: boolean): void {
  emit('update:modelValue', marcada ? props.cuentas.map((c) => c.id) : [])
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        type="button"
        class="justify-between font-normal"
        aria-label="Filtrar por cuenta"
      >
        {{ textoDisparador }}
        <ChevronDown class="text-muted-foreground size-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-64 p-2">
      <div class="flex items-center gap-2 px-2 py-1.5">
        <Checkbox
          id="filtro-cuentas-todas"
          :model-value="todasSeleccionadas"
          @update:model-value="(valor) => alternarTodas(valor === true)"
        />
        <Label for="filtro-cuentas-todas" class="font-medium">Seleccionar todas</Label>
      </div>
      <Separator class="my-1" />
      <ul class="max-h-64 space-y-1 overflow-y-auto">
        <li v-for="cuenta in cuentas" :key="cuenta.id" class="flex items-center gap-2 px-2 py-1.5">
          <Checkbox
            :id="`filtro-cuenta-${cuenta.id}`"
            :model-value="estaSeleccionada(cuenta.id)"
            @update:model-value="(valor) => alternarCuenta(cuenta.id, valor === true)"
          />
          <Label :for="`filtro-cuenta-${cuenta.id}`" class="truncate font-normal">{{
            nombreCuenta(cuenta)
          }}</Label>
        </li>
      </ul>
    </PopoverContent>
  </Popover>
</template>
