<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { FilaResumenAnual } from '@/api/tipos'
import { claseColorImporte, formatearImporte } from '@/lib/formato'
import { agruparFilasResumenAnualPorCategoria } from '@/lib/resumenAnualPorCategoria'
import { useTiendaCategorias } from '@/stores/categorias'
import TablaResumenAnual from '@/componentes/prevision/TablaResumenAnual.vue'

const props = defineProps<{
  titulo: string
  filas: FilaResumenAnual[]
  mensajeVacio: string
}>()

const emit = defineEmits<{
  editar: [conceptoId: number]
  eliminar: [conceptoId: number]
  'editar-celda': [conceptoId: number, mes: number, importe: string | null]
}>()

const tiendaCategorias = useTiendaCategorias()

function nombreCategoria(idCategoria: number): string {
  return (
    tiendaCategorias.categorias.find((c) => c.categoria.id === idCategoria)?.categoria.nombre ?? ''
  )
}

const grupos = computed(() => agruparFilasResumenAnualPorCategoria(props.filas, nombreCategoria))

const categoriasAbiertas = ref<Set<number>>(new Set())

function alternarCategoria(idCategoria: number): void {
  const nuevo = new Set(categoriasAbiertas.value)
  if (nuevo.has(idCategoria)) nuevo.delete(idCategoria)
  else nuevo.add(idCategoria)
  categoriasAbiertas.value = nuevo
}
</script>

<template>
  <section>
    <h3 class="text-lg font-semibold">{{ titulo }}</h3>
    <p v-if="filas.length === 0" class="text-muted-foreground mt-2 text-sm">{{ mensajeVacio }}</p>
    <div v-else class="mt-2 flex flex-col gap-2">
      <div
        v-for="grupo in grupos"
        :key="grupo.categoriaId"
        class="overflow-hidden rounded-lg border"
      >
        <button
          type="button"
          class="hover:bg-muted/50 flex w-full items-center gap-3 p-2 text-left"
          :aria-expanded="categoriasAbiertas.has(grupo.categoriaId)"
          @click="alternarCategoria(grupo.categoriaId)"
        >
          <ChevronRight
            class="size-4 shrink-0 transition-transform"
            :class="categoriasAbiertas.has(grupo.categoriaId) ? 'rotate-90' : ''"
          />
          <span class="flex-1 truncate font-medium">{{ grupo.nombre }}</span>
          <span
            class="w-28 shrink-0 text-right text-sm tabular-nums"
            :class="claseColorImporte(grupo.totalAnual)"
            >{{ formatearImporte(grupo.totalAnual) }}</span
          >
          <span class="text-muted-foreground w-24 shrink-0 text-right text-sm"
            >{{ grupo.filas.length }} concepto{{ grupo.filas.length === 1 ? '' : 's' }}</span
          >
        </button>

        <div v-if="categoriasAbiertas.has(grupo.categoriaId)" class="border-t p-2">
          <TablaResumenAnual
            :titulo="grupo.nombre"
            :filas="grupo.filas"
            :totales="grupo.totalesPorMes"
            mensaje-vacio=""
            ocultar-titulo
            @editar="emit('editar', $event)"
            @eliminar="emit('eliminar', $event)"
            @editar-celda="
              (conceptoId, mes, importe) => emit('editar-celda', conceptoId, mes, importe)
            "
          />
        </div>
      </div>
    </div>
  </section>
</template>
