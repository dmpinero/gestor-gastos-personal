<script setup lang="ts">
import { DatabaseBackup } from '@lucide/vue'
import { ref } from 'vue'
import type { DriveStep } from 'driver.js'
import { useTiendaExportacion } from '@/stores/exportacion'
import { useRegistrarTourPagina } from '@/composables/useTourGuiado'
import { Button } from '@/componentes/ui/button'

const tienda = useTiendaExportacion()
const exportando = ref(false)

async function exportar(): Promise<void> {
  exportando.value = true
  try {
    await tienda.exportarDatosCompletos()
  } finally {
    exportando.value = false
  }
}

function pasosTour(): DriveStep[] {
  return [
    {
      element: '[data-tour="backup-accion"]',
      popover: {
        title: 'Realizar backup',
        description:
          'Descarga un Excel con toda la información almacenada actualmente: cuentas, categorías, subcategorías, movimientos, conceptos previstos, ajustes mensuales y asociaciones de conceptos.',
      },
    },
  ]
}

useRegistrarTourPagina({ pasos: pasosTour })
</script>

<template>
  <section>
    <div data-tour="backup-accion">
      <p class="text-muted-foreground max-w-prose text-sm">
        Descarga un Excel con toda la información almacenada actualmente en la aplicación: cuentas,
        categorías, subcategorías, movimientos, conceptos previstos, ajustes mensuales y
        asociaciones de conceptos (por categoría y por descripción).
      </p>

      <Button class="mt-4" variant="outline" :disabled="exportando" @click="exportar">
        <DatabaseBackup class="size-4" />
        {{ exportando ? 'Generando backup…' : 'Realizar backup' }}
      </Button>
    </div>

    <p v-if="tienda.error" class="mt-2 text-sm text-destructive" role="alert">
      {{ tienda.error }}
    </p>
  </section>
</template>
