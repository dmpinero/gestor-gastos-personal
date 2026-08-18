<script setup lang="ts">
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { ResumenImportacion } from '@/api/tipos'
import { Button } from '@/componentes/ui/button'
import ZonaSoltarFichero from '@/componentes/importacion/ZonaSoltarFichero.vue'

const ficheroSeleccionado = ref<File | null>(null)
const importando = ref(false)
const error = ref<string | null>(null)
const resumen = ref<ResumenImportacion | null>(null)

function onFicheroElegido(fichero: File): void {
  ficheroSeleccionado.value = fichero
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
    <p class="text-muted-foreground">Sube el extracto de tu banco en formato .xls o .xlsx.</p>

    <form class="mt-4 flex flex-col items-start gap-3" @submit.prevent="importar">
      <ZonaSoltarFichero
        :fichero-seleccionado="ficheroSeleccionado"
        class="w-full max-w-md"
        @fichero-elegido="onFicheroElegido"
      />
      <Button type="submit" :disabled="!ficheroSeleccionado || importando">
        {{ importando ? 'Importando…' : 'Importar' }}
      </Button>
    </form>

    <p v-if="error" class="mt-4 text-sm text-destructive" role="alert">{{ error }}</p>

    <div v-if="resumen" class="mt-6 rounded-lg border p-4" data-test="resumen-importacion">
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
