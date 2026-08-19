<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { clienteApi } from '@/api/cliente'
import type { ResumenImportacion } from '@/api/tipos'
import { Button } from '@/componentes/ui/button'
import ZonaSoltarFichero from '@/componentes/importacion/ZonaSoltarFichero.vue'

const router = useRouter()

interface ResultadoImportacionFichero {
  nombreFichero: string
  resumen?: ResumenImportacion
  error?: string
}

const ficherosSeleccionados = ref<File[]>([])
const importando = ref(false)
const resultados = ref<ResultadoImportacionFichero[]>([])

const resumenAgregado = computed(() => {
  const conExito = resultados.value.filter(
    (resultado): resultado is ResultadoImportacionFichero & { resumen: ResumenImportacion } =>
      resultado.resumen !== undefined,
  )
  if (conExito.length === 0) return null

  return {
    movimientos_importados: conExito.reduce(
      (total, r) => total + r.resumen.movimientos_importados,
      0,
    ),
    movimientos_omitidos_por_duplicado: conExito.reduce(
      (total, r) => total + r.resumen.movimientos_omitidos_por_duplicado,
      0,
    ),
    categorias_creadas: [...new Set(conExito.flatMap((r) => r.resumen.categorias_creadas))],
    subcategorias_creadas: [...new Set(conExito.flatMap((r) => r.resumen.subcategorias_creadas))],
  }
})

const ficherosConError = computed(() => resultados.value.filter((r) => r.error !== undefined))

// Se navega a la cuenta del primer fichero importado con éxito; para el caso
// habitual (un solo fichero, o varios de la misma cuenta) es la cuenta
// correcta en todos los casos.
const cuentaIdImportada = computed(
  () => resultados.value.find((r) => r.resumen !== undefined)?.resumen?.cuenta_id,
)

function verMovimientosImportados(): void {
  if (cuentaIdImportada.value === undefined) return
  router.push({
    path: '/gestion/movimientos',
    query: { cuenta_id: String(cuentaIdImportada.value) },
  })
}

function onFicherosElegidos(ficheros: File[]): void {
  ficherosSeleccionados.value = ficheros
  resultados.value = []
}

async function importar(): Promise<void> {
  if (ficherosSeleccionados.value.length === 0) return

  importando.value = true
  resultados.value = []
  // Se procesan uno a uno: si un fichero falla (p. ej. extensión no
  // soportada), no debe impedir que se importen el resto ("procesamiento
  // masivo" resiliente a fallos parciales).
  for (const fichero of ficherosSeleccionados.value) {
    try {
      const resumen = await clienteApi.subirArchivo<ResumenImportacion>(
        '/movimientos/importar',
        'fichero',
        fichero,
      )
      resultados.value.push({ nombreFichero: fichero.name, resumen })
    } catch (motivo) {
      resultados.value.push({ nombreFichero: fichero.name, error: (motivo as Error).message })
    }
  }
  importando.value = false
}
</script>

<template>
  <section>
    <p class="text-muted-foreground">
      Sube uno o varios extractos de tu banco en formato .xls o .xlsx.
    </p>

    <form class="mt-4 flex flex-col items-start gap-3" @submit.prevent="importar">
      <ZonaSoltarFichero
        :ficheros-seleccionados="ficherosSeleccionados"
        class="w-full"
        @ficheros-elegidos="onFicherosElegidos"
      />
      <Button
        type="submit"
        variant="success"
        :disabled="ficherosSeleccionados.length === 0 || importando"
      >
        {{ importando ? 'Importando…' : 'Importar' }}
      </Button>
    </form>

    <div v-if="ficherosConError.length > 0" class="mt-4 text-sm text-destructive" role="alert">
      <p v-for="resultado in ficherosConError" :key="resultado.nombreFichero">
        {{ resultado.nombreFichero }}: {{ resultado.error }}
      </p>
    </div>

    <div v-if="resumenAgregado" class="mt-6 rounded-lg border p-4" data-test="resumen-importacion">
      <h3 class="font-medium">Resumen de la importación</h3>
      <ul class="mt-2 text-sm">
        <li>Movimientos importados: {{ resumenAgregado.movimientos_importados }}</li>
        <li>
          Movimientos omitidos por duplicado:
          {{ resumenAgregado.movimientos_omitidos_por_duplicado }}
        </li>
        <li>Categorías nuevas: {{ resumenAgregado.categorias_creadas.join(', ') || 'ninguna' }}</li>
        <li>
          Subcategorías nuevas: {{ resumenAgregado.subcategorias_creadas.join(', ') || 'ninguna' }}
        </li>
      </ul>

      <ul v-if="resultados.length > 1" class="mt-4 space-y-1 border-t pt-2 text-sm">
        <li v-for="resultado in resultados" :key="resultado.nombreFichero">
          <template v-if="resultado.resumen">
            {{ resultado.nombreFichero }}:
            {{ resultado.resumen.movimientos_importados }} importados,
            {{ resultado.resumen.movimientos_omitidos_por_duplicado }} omitidos
          </template>
          <template v-else>{{ resultado.nombreFichero }}: {{ resultado.error }}</template>
        </li>
      </ul>

      <Button variant="outline" class="mt-4" @click="verMovimientosImportados">
        Ver movimientos importados
      </Button>
    </div>
  </section>
</template>
