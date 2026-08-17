<script setup lang="ts">
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

withDefaults(defineProps<{ descripcion: string; textoBoton?: string }>(), {
  textoBoton: 'Eliminar',
})
const emit = defineEmits<{ confirmar: [] }>()
</script>

<template>
  <AlertDialog>
    <AlertDialogTrigger as-child>
      <Button variant="link" class="text-destructive">{{ textoBoton }}</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar {{ descripcion }}?</AlertDialogTitle>
        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction @click="emit('confirmar')">Eliminar</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
