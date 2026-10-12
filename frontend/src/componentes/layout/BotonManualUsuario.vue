<script setup lang="ts">
import { CircleHelp, GraduationCap } from '@lucide/vue'
import { ref } from 'vue'
import { useTourGuiado } from '@/composables/useTourGuiado'
import { Button } from '@/componentes/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import ModalChangelog from './ModalChangelog.vue'

const { iniciar } = useTourGuiado()

const abierto = ref(false)

function abrirTour(): void {
  abierto.value = false
  iniciar()
}
</script>

<template>
  <Popover v-model:open="abierto">
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ayuda: manual de usuario interactivo e historial de cambios"
        data-tour="boton-manual-usuario"
      >
        <CircleHelp class="size-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-56 p-1" align="end">
      <Button variant="ghost" class="w-full justify-start gap-2" @click="abrirTour">
        <GraduationCap class="size-4" />
        Manual de usuario
      </Button>
      <ModalChangelog />
    </PopoverContent>
  </Popover>
</template>
