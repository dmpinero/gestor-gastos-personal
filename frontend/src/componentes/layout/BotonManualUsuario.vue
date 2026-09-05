<script setup lang="ts">
import { CircleHelp } from '@lucide/vue'
import { useTourGuiado } from '@/composables/useTourGuiado'
import { Button } from '@/componentes/ui/button'

const { iniciar } = useTourGuiado()
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    aria-label="Abrir el manual de usuario interactivo"
    data-tour="boton-manual-usuario"
    @click="iniciar"
  >
    <CircleHelp class="size-4" />
  </Button>
</template>
