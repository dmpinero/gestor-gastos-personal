<script setup lang="ts">
import { ref } from 'vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/componentes/ui/alert-dialog'
import { Button } from '@/componentes/ui/button'

export interface Dependencia {
  etiqueta: string
  cantidad: number
}

const props = withDefaults(
  defineProps<{
    descripcion: string
    textoBoton?: string
    obtenerDependencias?: () => Promise<Dependencia[]>
  }>(),
  { textoBoton: 'Eliminar' },
)
const emit = defineEmits<{ confirmar: [cascada: boolean] }>()

const dependencias = ref<Dependencia[]>([])
const comprobandoDependencias = ref(false)

async function alAbrir(abierto: boolean): Promise<void> {
  if (!abierto || !props.obtenerDependencias) {
    dependencias.value = []
    return
  }
  comprobandoDependencias.value = true
  try {
    dependencias.value = (await props.obtenerDependencias()).filter((d) => d.cantidad > 0)
  } finally {
    comprobandoDependencias.value = false
  }
}

function confirmarBorrado(): void {
  emit('confirmar', dependencias.value.length > 0)
}
</script>

<template>
  <AlertDialog @update:open="alAbrir">
    <AlertDialogTrigger as-child>
      <slot name="disparador">
        <Button variant="link" class="text-destructive">{{ textoBoton }}</Button>
      </slot>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar {{ descripcion }}?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acción no se puede deshacer.
          <template v-if="dependencias.length > 0">
            También se eliminarán:
            {{ dependencias.map((d) => `${d.cantidad} ${d.etiqueta}`).join(', ') }}.
          </template>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction :disabled="comprobandoDependencias" @click="confirmarBorrado"
          >Eliminar</AlertDialogAction
        >
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
