<script setup lang="ts">
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { ResumenImportacion } from '@/api/tipos'

const ficheroSeleccionado = ref<File | null>(null)
const importando = ref(false)
const error = ref<string | null>(null)
const resumen = ref<ResumenImportacion | null>(null)

function seleccionarFichero(evento: Event): void {
  const input = evento.target as HTMLInputElement
  ficheroSeleccionado.value = input.files?.[0] ?? null
  resumen.value = null
  error.value = null
}

async function importar(): Promise<void> {
  if (!ficheroSeleccionado.value) return

  importando.value = true
  error.value = null
  resumen.value = null
  try {
    resumen.value = await clienteApi.subirArchivo<ResumenImportacion>(
      '/movimientos/importar',
      'fichero',
      ficheroSeleccionado.value,
    )
  } catch (motivo) {
    error.value = (motivo as Error).message
  } finally {
    importando.value = false
  }
}
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold">Importar movimientos desde Excel</h2>
    <p class="mt-2 text-gray-600">Sube el extracto de tu banco en formato .xls o .xlsx.</p>

    <form class="mt-4 flex items-center gap-3" @submit.prevent="importar">
      <input type="file" accept=".xls,.xlsx" @change="seleccionarFichero" />
      <button
        type="submit"
        :disabled="!ficheroSeleccionado || importando"
        class="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
      >
        {{ importando ? 'Importando…' : 'Importar' }}
      </button>
    </form>

    <p v-if="error" class="mt-4 text-sm text-red-600" role="alert">{{ error }}</p>

    <div
      v-if="resumen"
      class="mt-6 rounded border border-gray-200 p-4"
      data-test="resumen-importacion"
    >
      <h3 class="font-medium">Resumen de la importación</h3>
      <ul class="mt-2 text-sm">
        <li>Movimientos importados: {{ resumen.movimientos_importados }}</li>
        <li>
          Movimientos omitidos por duplicado: {{ resumen.movimientos_omitidos_por_duplicado }}
        </li>
        <li>Categorías nuevas: {{ resumen.categorias_creadas.join(', ') || 'ninguna' }}</li>
        <li>Subcategorías nuevas: {{ resumen.subcategorias_creadas.join(', ') || 'ninguna' }}</li>
      </ul>
    </div>
  </section>
</template>
