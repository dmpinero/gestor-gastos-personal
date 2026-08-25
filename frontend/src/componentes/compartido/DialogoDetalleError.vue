<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/componentes/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/componentes/ui/dialog'

const props = defineProps<{
  mensaje: string
  traza?: string | null
}>()

const copiado = ref(false)

async function copiar(): Promise<void> {
  if (!props.traza) return
  await navigator.clipboard.writeText(props.traza)
  copiado.value = true
  setTimeout(() => {
    copiado.value = false
  }, 2000)
}
</script>

<template>
  <Dialog v-if="traza">
    <DialogTrigger as-child>
      <Button variant="link" class="text-destructive h-auto p-0 underline">Más detalle</Button>
    </DialogTrigger>
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Detalle del error</DialogTitle>
        <DialogDescription>{{ mensaje }}</DialogDescription>
      </DialogHeader>
      <pre
        class="bg-muted max-h-96 overflow-y-auto rounded-md p-3 text-xs break-words whitespace-pre-wrap"
        >{{ traza }}</pre>
      <DialogFooter>
        <Button type="button" variant="outline" @click="copiar">
          {{ copiado ? 'Copiado' : 'Copiar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
