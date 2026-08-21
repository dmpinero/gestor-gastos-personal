<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { clienteApi, ErrorApi } from '@/api/cliente'
import type { ResumenImportacion, ResumenImportacionConceptosPrevistos } from '@/api/tipos'
import DialogoDetalleError from '@/componentes/compartido/DialogoDetalleError.vue'
import { Button } from '@/componentes/ui/button'
import ZonaSoltarFichero from '@/componentes/importacion/ZonaSoltarFichero.vue'
import { useTiendaPrevisiones } from '@/stores/previsiones'

const router = useRouter()
const tiendaPrevisiones = useTiendaPrevisiones()

interface ResultadoImportacionFichero {
  nombreFichero: string
  resumen?: ResumenImportacion
  error?: string
  traza?: string
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
      resultados.value.push({
        nombreFichero: fichero.name,
        error: (motivo as Error).message,
        traza: motivo instanceof ErrorApi ? motivo.traza : undefined,
      })
    }
  }
  importando.value = false
}

interface ResultadoImportacionConceptosFichero {
  nombreFichero: string
  resumen?: ResumenImportacionConceptosPrevistos
  error?: string
  traza?: string
}

const ficherosSeleccionadosConceptos = ref<File[]>([])
const importandoConceptos = ref(false)
const resultadosConceptos = ref<ResultadoImportacionConceptosFichero[]>([])

const resumenAgregadoConceptos = computed(() => {
  const conExito = resultadosConceptos.value.filter(
    (
      resultado,
    ): resultado is ResultadoImportacionConceptosFichero & {
      resumen: ResumenImportacionConceptosPrevistos
    } => resultado.resumen !== undefined,
  )
  if (conExito.length === 0) return null

  return {
    conceptos_creados: conExito.reduce((total, r) => total + r.resumen.conceptos_creados, 0),
    conceptos_omitidos_por_duplicado: conExito.reduce(
      (total, r) => total + r.resumen.conceptos_omitidos_por_duplicado,
      0,
    ),
    categorias_creadas: [...new Set(conExito.flatMap((r) => r.resumen.categorias_creadas))],
    subcategorias_creadas: [...new Set(conExito.flatMap((r) => r.resumen.subcategorias_creadas))],
  }
})

const ficherosConErrorConceptos = computed(() =>
  resultadosConceptos.value.filter((r) => r.error !== undefined),
)

function onFicherosElegidosConceptos(ficheros: File[]): void {
  ficherosSeleccionadosConceptos.value = ficheros
  resultadosConceptos.value = []
}

async function importarConceptos(): Promise<void> {
  if (ficherosSeleccionadosConceptos.value.length === 0) return

  importandoConceptos.value = true
  resultadosConceptos.value = []
  for (const fichero of ficherosSeleccionadosConceptos.value) {
    const resumen = await tiendaPrevisiones.importarConceptosPrevistosExcel(fichero)
    if (resumen) {
      resultadosConceptos.value.push({ nombreFichero: fichero.name, resumen })
    } else {
      resultadosConceptos.value.push({
        nombreFichero: fichero.name,
        error: tiendaPrevisiones.error ?? 'Error desconocido',
        traza: tiendaPrevisiones.errorTraza ?? undefined,
      })
    }
  }
  importandoConceptos.value = false
}

function verResumenAnual(): void {
  router.push('/resumen-anual')
}
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold">Importar movimientos</h2>
    <p class="text-muted-foreground mt-2">
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
        <DialogoDetalleError :mensaje="resultado.error ?? ''" :traza="resultado.traza" />
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

    <section class="mt-10 border-t pt-8">
      <h2 class="text-xl font-semibold">Importar conceptos previstos</h2>
      <p class="text-muted-foreground mt-2">
        Sube uno o varios Excel con columnas Categoría, Subcategoría, Periodicidad e Importe
        previsto para dar de alta conceptos previstos del Resumen anual.
      </p>

      <form class="mt-4 flex flex-col items-start gap-3" @submit.prevent="importarConceptos">
        <ZonaSoltarFichero
          :ficheros-seleccionados="ficherosSeleccionadosConceptos"
          etiqueta="archivos Excel de conceptos previstos"
          accept=".xlsx"
          class="w-full"
          @ficheros-elegidos="onFicherosElegidosConceptos"
        />
        <Button
          type="submit"
          variant="success"
          :disabled="ficherosSeleccionadosConceptos.length === 0 || importandoConceptos"
        >
          {{ importandoConceptos ? 'Importando…' : 'Importar' }}
        </Button>
      </form>

      <div
        v-if="ficherosConErrorConceptos.length > 0"
        class="mt-4 text-sm text-destructive"
        role="alert"
      >
        <p v-for="resultado in ficherosConErrorConceptos" :key="resultado.nombreFichero">
          {{ resultado.nombreFichero }}: {{ resultado.error }}
          <DialogoDetalleError :mensaje="resultado.error ?? ''" :traza="resultado.traza" />
        </p>
      </div>

      <div
        v-if="resumenAgregadoConceptos"
        class="mt-6 rounded-lg border p-4"
        data-test="resumen-importacion-conceptos-previstos"
      >
        <h3 class="font-medium">Resumen de la importación</h3>
        <ul class="mt-2 text-sm">
          <li>Conceptos creados: {{ resumenAgregadoConceptos.conceptos_creados }}</li>
          <li>
            Conceptos omitidos por duplicado:
            {{ resumenAgregadoConceptos.conceptos_omitidos_por_duplicado }}
          </li>
          <li>
            Categorías nuevas:
            {{ resumenAgregadoConceptos.categorias_creadas.join(', ') || 'ninguna' }}
          </li>
          <li>
            Subcategorías nuevas:
            {{ resumenAgregadoConceptos.subcategorias_creadas.join(', ') || 'ninguna' }}
          </li>
        </ul>

        <ul v-if="resultadosConceptos.length > 1" class="mt-4 space-y-1 border-t pt-2 text-sm">
          <li v-for="resultado in resultadosConceptos" :key="resultado.nombreFichero">
            <template v-if="resultado.resumen">
              {{ resultado.nombreFichero }}: {{ resultado.resumen.conceptos_creados }} creados,
              {{ resultado.resumen.conceptos_omitidos_por_duplicado }} omitidos
            </template>
            <template v-else>{{ resultado.nombreFichero }}: {{ resultado.error }}</template>
          </li>
        </ul>

        <Button variant="outline" class="mt-4" @click="verResumenAnual">
          Ver en Resumen anual
        </Button>
      </div>
    </section>
  </section>
</template>
