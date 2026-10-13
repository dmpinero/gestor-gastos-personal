<script setup lang="ts">
import { Paperclip } from '@lucide/vue'
import { computed } from 'vue'

import { urlRecurso } from '@/api/cliente'
import { Popover, PopoverContent, PopoverTrigger } from '@/componentes/ui/popover'
import { useTiendaAdjuntos } from '@/stores/adjuntos'

const props = defineProps<{ movimientoId: number }>()

const tienda = useTiendaAdjuntos()

const cantidad = computed(() => tienda.conteos[props.movimientoId] ?? 0)
const adjuntos = computed(() => tienda.adjuntosPorMovimiento[props.movimientoId] ?? [])
const etiqueta = computed(
  () => `${cantidad.value} ${cantidad.value === 1 ? 'adjunto' : 'adjuntos'}`,
)

function alAbrir(abierto: boolean): void {
  if (abierto) tienda.cargarDeMovimiento(props.movimientoId)
}
</script>

<template>
  <Popover v-if="cantidad > 0" @update:open="alAbrir">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-0.5"
        :aria-label="etiqueta"
        :title="etiqueta"
        @click.stop
      >
        <Paperclip class="size-3.5" />
        <span class="text-xs tabular-nums">{{ cantidad }}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-64 p-2" @click.stop>
      <ul class="flex flex-col gap-1">
        <li v-for="adjunto in adjuntos" :key="adjunto.id">
          <a
            :href="urlRecurso(`/adjuntos/${adjunto.id}/ver`)"
            target="_blank"
            rel="noopener"
            class="hover:bg-muted block truncate rounded px-2 py-1 text-sm underline-offset-2 hover:underline"
            :title="adjunto.nombre_original"
            >{{ adjunto.nombre_original }}</a
          >
        </li>
      </ul>
      <p v-if="tienda.cargando" class="text-muted-foreground px-2 py-1 text-sm">Cargando…</p>
    </PopoverContent>
  </Popover>
</template>
