<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog'
import { Progress } from '@/componentes/ui/progress'

defineProps<{
  titulo: string
  etiquetaUnidad: string
  progreso: { procesadas: number; total: number } | null
}>()
</script>

<template>
  <Dialog :open="true">
    <DialogContent sin-cerrar class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ titulo }}</DialogTitle>
        <DialogDescription>
          <template v-if="progreso">
            {{ progreso.procesadas }} de {{ progreso.total }} {{ etiquetaUnidad }}
          </template>
          <template v-else>Preparando…</template>
        </DialogDescription>
      </DialogHeader>
      <Progress :model-value="progreso?.procesadas ?? 0" :max="progreso?.total || 1" />
    </DialogContent>
  </Dialog>
</template>
