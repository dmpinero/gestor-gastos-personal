<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import type { DatosConceptoPrevisto, Periodicidad } from '@/api/tipos'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaPrevisiones } from '@/stores/previsiones'
import TablaResumenAnual from '@/componentes/prevision/TablaResumenAnual.vue'
import { Button } from '@/componentes/ui/button'
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
</script>

<template>
  <section>
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Resumen anual</h2>
      <Button variant="success" @click="abrirParaCrear">Añadir concepto</Button>
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
            <Select v-model="formulario.categoriaId">
              <SelectTrigger
                id="selector-categoria-previsto"
                aria-labelledby="etiqueta-categoria-previsto"
              >
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="cat in tiendaCategorias.categorias"
                  :key="cat.categoria.id"
                  :value="String(cat.categoria.id)"
                >
                  {{ cat.categoria.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
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
