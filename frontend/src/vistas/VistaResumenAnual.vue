<script setup lang="ts">
import { Download, Plus, Upload } from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import type {
  DatosConceptoPrevisto,
  Periodicidad,
  ResumenImportacionResumenAnual,
} from '@/api/tipos'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaDashboard } from '@/stores/dashboard'
import { useTiendaPrevisiones } from '@/stores/previsiones'
import DialogoDetalleError from '@/componentes/compartido/DialogoDetalleError.vue'
import ZonaSoltarFichero from '@/componentes/importacion/ZonaSoltarFichero.vue'
import TablaResumenAnual from '@/componentes/prevision/TablaResumenAnual.vue'
import { Button } from '@/componentes/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/componentes/ui/sheet'

const tiendaCategorias = useTiendaCategorias()
const tiendaDashboard = useTiendaDashboard()
const tienda = useTiendaPrevisiones()

const MESES_COMPLETOS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const anio = ref(new Date().getFullYear())

function cargarResumen(): void {
  tienda.cargarResumenAnual(anio.value)
}

onMounted(() => {
  tiendaCategorias.cargar()
  tienda.cargar()
  cargarResumen()
  if (!tiendaDashboard.resumen) tiendaDashboard.cargar()
})

watch(anio, cargarResumen)

const SIN_SUBCATEGORIA = 'sin-subcategoria'

const panelAbierto = ref(false)
const idEnEdicion = ref<number | null>(null)
const errorPanel = ref<string | null>(null)

const formulario = reactive({
  categoriaId: '',
  subcategoriaId: SIN_SUBCATEGORIA,
  periodicidad: 'mensual' as Periodicidad,
  mesInicio: '',
  tipo: 'gasto' as 'gasto' | 'ingreso',
  importePrevisto: '',
})

const subcategoriasDeLaCategoria = computed(() => {
  const categoria = tiendaCategorias.categorias.find(
    (c) => c.categoria.id === Number(formulario.categoriaId),
  )
  return categoria?.subcategorias ?? []
})

// Las categorías no tienen un tipo (ingreso/gasto) propio: se infiere de los
// movimientos ya registrados (GET /dashboard/resumen). Por exclusión, no por
// inclusión estricta: una categoría sin movimientos todavía, o con
// movimientos de ambos tipos, se muestra siempre; solo se oculta la que ya
// es evidentemente exclusiva del tipo contrario. Así no se rompe el caso de
// planificar un concepto para una categoría recién creada, sin histórico.
const idsSoloGasto = computed(() => {
  const idsIngreso = new Set(
    (tiendaDashboard.resumen?.ingresos_por_categoria ?? []).map((c) => c.categoria_id),
  )
  return (tiendaDashboard.resumen?.gastos_por_categoria ?? [])
    .map((c) => c.categoria_id)
    .filter((id) => !idsIngreso.has(id))
})

const idsSoloIngreso = computed(() => {
  const idsGasto = new Set(
    (tiendaDashboard.resumen?.gastos_por_categoria ?? []).map((c) => c.categoria_id),
  )
  return (tiendaDashboard.resumen?.ingresos_por_categoria ?? [])
    .map((c) => c.categoria_id)
    .filter((id) => !idsGasto.has(id))
})

// Se incluye siempre la categoría ya elegida, aunque quede excluida para el
// tipo actual: un concepto puede combinar cualquier categoría con cualquier
// tipo (ver el test "Regresión del bug: un concepto con Tipo=Ingreso debe
// aparecer en 'Ingresos'"), así que cambiar el Tipo después de elegir la
// categoría no debe hacerla desaparecer ni perderla.
const categoriasDelTipoElegido = computed(() => {
  const excluidos = new Set(
    formulario.tipo === 'ingreso' ? idsSoloGasto.value : idsSoloIngreso.value,
  )
  return tiendaCategorias.categorias
    .map((c) => c.categoria)
    .filter((c) => !excluidos.has(c.id) || c.id === Number(formulario.categoriaId))
})

const panelCrearCategoriaAbierto = ref(false)
const nombreNuevaCategoria = ref('')
const errorCrearCategoria = ref<string | null>(null)

function abrirCrearCategoria(): void {
  nombreNuevaCategoria.value = ''
  errorCrearCategoria.value = null
  panelCrearCategoriaAbierto.value = true
}

async function crearCategoriaNueva(): Promise<void> {
  errorCrearCategoria.value = null
  try {
    const categoria = await tiendaCategorias.crearCategoria(nombreNuevaCategoria.value)
    formulario.categoriaId = String(categoria.id)
    formulario.subcategoriaId = SIN_SUBCATEGORIA
    panelCrearCategoriaAbierto.value = false
  } catch (motivo) {
    errorCrearCategoria.value = (motivo as Error).message
  }
}

function limpiarFormulario(): void {
  idEnEdicion.value = null
  formulario.categoriaId = ''
  formulario.subcategoriaId = SIN_SUBCATEGORIA
  formulario.periodicidad = 'mensual'
  formulario.mesInicio = ''
  formulario.tipo = 'gasto'
  formulario.importePrevisto = ''
}

function abrirParaCrear(): void {
  limpiarFormulario()
  errorPanel.value = null
  panelAbierto.value = true
}

function abrirParaEditar(idConcepto: number): void {
  const concepto = tienda.conceptos.find((c) => c.id === idConcepto)
  if (!concepto) return
  idEnEdicion.value = concepto.id
  formulario.categoriaId = String(concepto.categoria_id)
  formulario.subcategoriaId = concepto.subcategoria_id
    ? String(concepto.subcategoria_id)
    : SIN_SUBCATEGORIA
  formulario.periodicidad = concepto.periodicidad
  formulario.mesInicio = concepto.mes_inicio ? String(concepto.mes_inicio) : ''
  formulario.tipo = Number(concepto.importe_previsto) < 0 ? 'gasto' : 'ingreso'
  formulario.importePrevisto = Math.abs(Number(concepto.importe_previsto)).toFixed(2)
  errorPanel.value = null
  panelAbierto.value = true
}

async function guardar(): Promise<void> {
  errorPanel.value = null
  const magnitud = Math.abs(Number(formulario.importePrevisto))
  const datos: DatosConceptoPrevisto = {
    categoria_id: Number(formulario.categoriaId),
    subcategoria_id:
      formulario.subcategoriaId === SIN_SUBCATEGORIA ? null : Number(formulario.subcategoriaId),
    periodicidad: formulario.periodicidad,
    mes_inicio:
      formulario.periodicidad === 'mensual' || formulario.mesInicio === ''
        ? null
        : Number(formulario.mesInicio),
    importe_previsto: (formulario.tipo === 'gasto' ? -magnitud : magnitud).toFixed(2),
  }
  try {
    if (idEnEdicion.value === null) {
      await tienda.crear(datos)
    } else {
      await tienda.actualizar(idEnEdicion.value, datos)
    }
    panelAbierto.value = false
    await cargarResumen()
  } catch (motivo) {
    errorPanel.value = (motivo as Error).message
  }
}

async function eliminar(idConcepto: number): Promise<void> {
  errorPanel.value = null
  try {
    await tienda.eliminar(idConcepto)
    await cargarResumen()
  } catch (motivo) {
    errorPanel.value = (motivo as Error).message
  }
}

async function editarCelda(conceptoId: number, mes: number, importe: string | null): Promise<void> {
  if (importe === null) {
    await tienda.eliminarAjuste(conceptoId, anio.value, mes)
  } else {
    await tienda.ajustarCelda(conceptoId, anio.value, mes, importe)
  }
}

const panelExportarAbierto = ref(false)
const anioExportarDesde = ref(0)
const anioExportarHasta = ref(0)

function abrirExportar(): void {
  anioExportarDesde.value = anio.value
  anioExportarHasta.value = anio.value
  panelExportarAbierto.value = true
}

async function exportar(): Promise<void> {
  await tienda.exportarResumenAnual(anioExportarDesde.value, anioExportarHasta.value)
  panelExportarAbierto.value = false
}

const panelImportarAbierto = ref(false)
const ficherosParaImportar = ref<File[]>([])
const importando = ref(false)
const resultadoImportacion = ref<ResumenImportacionResumenAnual | null>(null)

function abrirImportar(): void {
  ficherosParaImportar.value = []
  resultadoImportacion.value = null
  tienda.error = null
  panelImportarAbierto.value = true
}

function ficherosElegidosParaImportar(ficheros: File[]): void {
  ficherosParaImportar.value = ficheros.slice(0, 1)
}

async function importar(): Promise<void> {
  const fichero = ficherosParaImportar.value[0]
  if (!fichero) return
  importando.value = true
  resultadoImportacion.value = await tienda.importarResumenAnualExcel(fichero)
  importando.value = false
  await cargarResumen()
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-xl font-semibold">Resumen anual</h2>
      <div class="flex gap-2">
        <Button variant="outline" @click="abrirImportar">
          <Upload class="size-4" />
          Importar Excel
        </Button>
        <Button variant="outline" @click="abrirExportar">
          <Download class="size-4" />
          Exportar a Excel
        </Button>
        <Button variant="success" @click="abrirParaCrear">Añadir concepto</Button>
      </div>
    </div>

    <div class="mt-4 flex max-w-32 flex-col gap-1.5">
      <Label for="anio-resumen">Año</Label>
      <Input id="anio-resumen" v-model.number="anio" type="number" />
    </div>

    <Sheet v-model:open="panelAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{{
            idEnEdicion === null ? 'Añadir concepto' : 'Editar concepto'
          }}</SheetTitle>
        </SheetHeader>

        <form class="flex flex-col gap-3 px-4" @submit.prevent="guardar">
          <div class="flex flex-col gap-1.5">
            <Label id="etiqueta-categoria-previsto" for="selector-categoria-previsto"
              >Categoría</Label
            >
            <div class="flex gap-2">
              <Select v-model="formulario.categoriaId">
                <SelectTrigger
                  id="selector-categoria-previsto"
                  aria-labelledby="etiqueta-categoria-previsto"
                  class="w-full"
                >
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="cat in categoriasDelTipoElegido"
                    :key="cat.id"
                    :value="String(cat.id)"
                  >
                    {{ cat.nombre }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Crear categoría"
                @click="abrirCrearCategoria"
              >
                <Plus class="size-4" />
              </Button>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label id="etiqueta-subcategoria-previsto" for="selector-subcategoria-previsto"
              >Subcategoría</Label
            >
            <Select v-model="formulario.subcategoriaId">
              <SelectTrigger
                id="selector-subcategoria-previsto"
                aria-labelledby="etiqueta-subcategoria-previsto"
              >
                <SelectValue placeholder="(sin subcategoría)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</SelectItem>
                <SelectItem
                  v-for="s in subcategoriasDeLaCategoria"
                  :key="s.id"
                  :value="String(s.id)"
                >
                  {{ s.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label id="etiqueta-periodicidad" for="selector-periodicidad">Periodicidad</Label>
            <Select v-model="formulario.periodicidad">
              <SelectTrigger id="selector-periodicidad" aria-labelledby="etiqueta-periodicidad">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="formulario.periodicidad !== 'mensual'" class="flex flex-col gap-1.5">
            <Label id="etiqueta-mes-inicio" for="selector-mes-inicio">Mes de inicio</Label>
            <Select v-model="formulario.mesInicio">
              <SelectTrigger id="selector-mes-inicio" aria-labelledby="etiqueta-mes-inicio">
                <SelectValue placeholder="Selecciona un mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="(mes, indice) in MESES_COMPLETOS"
                  :key="mes"
                  :value="String(indice + 1)"
                >
                  {{ mes }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label id="etiqueta-tipo-previsto" for="selector-tipo-previsto">Tipo</Label>
            <Select v-model="formulario.tipo">
              <SelectTrigger id="selector-tipo-previsto" aria-labelledby="etiqueta-tipo-previsto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gasto">Gasto</SelectItem>
                <SelectItem value="ingreso">Ingreso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label for="importe-previsto">Importe previsto</Label>
            <Input
              id="importe-previsto"
              v-model="formulario.importePrevisto"
              placeholder="Importe previsto (positivo)"
              required
            />
          </div>

          <p v-if="errorPanel" class="text-sm text-destructive" role="alert">{{ errorPanel }}</p>

          <div class="flex gap-2">
            <Button type="submit" variant="success">
              {{ idEnEdicion === null ? 'Añadir concepto' : 'Guardar cambios' }}
            </Button>
            <Button type="button" variant="destructive" @click="panelAbierto = false"
              >Cancelar</Button
            >
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <Dialog v-model:open="panelExportarAbierto">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar a Excel</DialogTitle>
        </DialogHeader>

        <div class="flex gap-3">
          <div class="flex flex-col gap-1.5">
            <Label for="anio-exportar-desde">Año desde</Label>
            <Input id="anio-exportar-desde" v-model.number="anioExportarDesde" type="number" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="anio-exportar-hasta">Año hasta</Label>
            <Input id="anio-exportar-hasta" v-model.number="anioExportarHasta" type="number" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="success" @click="exportar">Exportar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Sheet v-model:open="panelCrearCategoriaAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Crear categoría</SheetTitle>
        </SheetHeader>

        <form class="flex flex-col gap-3 px-4" @submit.prevent="crearCategoriaNueva">
          <div class="flex flex-col gap-1.5">
            <Label for="nombre-nueva-categoria-previsto">Nombre</Label>
            <Input
              id="nombre-nueva-categoria-previsto"
              v-model="nombreNuevaCategoria"
              placeholder="Nueva categoría"
              required
            />
          </div>

          <p v-if="errorCrearCategoria" class="text-sm text-destructive" role="alert">
            {{ errorCrearCategoria }}
          </p>

          <div class="flex gap-2">
            <Button type="submit" variant="success">Crear categoría</Button>
            <Button type="button" variant="destructive" @click="panelCrearCategoriaAbierto = false"
              >Cancelar</Button
            >
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <Sheet v-model:open="panelImportarAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Importar Excel</SheetTitle>
        </SheetHeader>

        <div class="flex flex-col gap-4 px-4">
          <p class="text-muted-foreground text-sm">
            Sube el Excel exportado del resumen anual (editado con los importes que quieras
            cambiar). Cada fila aplica al año de su propia columna "Año", así que puede incluir
            varios años a la vez. Solo se actualizan las celdas que hayan cambiado.
          </p>

          <ZonaSoltarFichero
            :ficheros-seleccionados="ficherosParaImportar"
            @ficheros-elegidos="ficherosElegidosParaImportar"
          />

          <p v-if="tienda.error" class="text-sm text-destructive" role="alert">
            {{ tienda.error }}
            <DialogoDetalleError :mensaje="tienda.error" :traza="tienda.errorTraza" />
          </p>

          <div v-if="resultadoImportacion" data-test="resumen-importacion-anual" class="text-sm">
            <p>{{ resultadoImportacion.celdas_actualizadas }} celdas actualizadas.</p>
            <p>
              {{ resultadoImportacion.celdas_eliminadas }} celdas revertidas al valor calculado.
            </p>
            <p v-if="resultadoImportacion.conceptos_no_encontrados > 0">
              {{ resultadoImportacion.conceptos_no_encontrados }} conceptos del fichero ya no
              existen y se han ignorado.
            </p>
          </div>

          <div class="flex gap-2">
            <Button
              type="button"
              variant="success"
              :disabled="ficherosParaImportar.length === 0 || importando"
              @click="importar"
            >
              Importar
            </Button>
            <Button type="button" variant="destructive" @click="panelImportarAbierto = false"
              >Cerrar</Button
            >
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <p v-if="tienda.error" class="mt-2 text-sm text-destructive" role="alert">
      {{ tienda.error }}
    </p>

    <div v-if="tienda.resumenAnual" class="mt-6 space-y-8">
      <TablaResumenAnual
        titulo="Gastos"
        :filas="tienda.resumenAnual.filas_gastos"
        :totales="tienda.resumenAnual.totales_gastos"
        mensaje-vacio="No hay conceptos de gasto configurados."
        @editar="abrirParaEditar"
        @eliminar="eliminar"
        @editar-celda="editarCelda"
      />
      <TablaResumenAnual
        titulo="Ingresos"
        :filas="tienda.resumenAnual.filas_ingresos"
        :totales="tienda.resumenAnual.totales_ingresos"
        mensaje-vacio="No hay conceptos de ingreso configurados."
        @editar="abrirParaEditar"
        @eliminar="eliminar"
        @editar-celda="editarCelda"
      />
    </div>
  </section>
</template>
