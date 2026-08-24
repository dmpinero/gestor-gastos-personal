<script setup lang="ts">
import { ChevronRight, Pencil, Search, X } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { Categoria, Movimiento, Subcategoria } from '@/api/tipos'
import { useBusquedaTabla } from '@/composables/useBusquedaTabla'
import { useProgresoTareas } from '@/composables/useProgresoTareas'
import { formatearFecha, formatearImporte } from '@/lib/formato'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import { Badge } from '@/componentes/ui/badge'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Checkbox } from '@/componentes/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/componentes/ui/collapsible'
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
import DialogoConfirmarEliminacion, {
  type Dependencia,
} from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'
import ModalProgresoBloqueante from '@/componentes/compartido/ModalProgresoBloqueante.vue'

const tienda = useTiendaCategorias()
const tiendaCuentas = useTiendaCuentas()
const error = ref<string | null>(null)
const errorPanel = ref<string | null>(null)
const subcategoriaNuevaPorCategoria = ref<Record<number, string>>({})

const panelAbierto = ref(false)
const idEnEdicion = ref<number | null>(null)
const nombreFormulario = ref('')
const seleccionadas = ref<Set<number>>(new Set())
const progresoEliminacion = useProgresoTareas()

const panelSubcategoriaAbierto = ref(false)
const subcategoriaEnEdicion = ref<{ id: number; categoriaOrigenId: number } | null>(null)
const nombreSubcategoriaFormulario = ref('')
const categoriaDestinoFormulario = ref<string | undefined>(undefined)
const errorPanelSubcategoria = ref<string | null>(null)

const filtrosAbiertos = ref(true)
// Todas las categorías empiezan expandidas; se guardan aquí solo las que el
// usuario ha contraído explícitamente (evita tener que sincronizar el
// conjunto de "abiertas" cada vez que se crea una categoría nueva).
const categoriasCerradas = ref<Set<number>>(new Set())

function categoriaAbierta(idCategoria: number): boolean {
  return !categoriasCerradas.value.has(idCategoria)
}

function alternarCategoria(idCategoria: number, abierta: boolean): void {
  const nuevo = new Set(categoriasCerradas.value)
  if (abierta) nuevo.delete(idCategoria)
  else nuevo.add(idCategoria)
  categoriasCerradas.value = nuevo
}

const { busqueda, filasFiltradas } = useBusquedaTabla(
  computed(() => tienda.categorias),
  (item) => [item.categoria.nombre, ...item.subcategorias.map((s) => s.nombre)],
)

const todasSeleccionadas = computed(
  () =>
    filasFiltradas.value.length > 0 &&
    filasFiltradas.value.every((c) => seleccionadas.value.has(c.categoria.id)),
)

onMounted(() => {
  tienda.cargar()
  tiendaCuentas.cargar()
})

function abrirParaCrear(): void {
  idEnEdicion.value = null
  nombreFormulario.value = ''
  errorPanel.value = null
  panelAbierto.value = true
}

function abrirParaEditar(categoria: Categoria): void {
  idEnEdicion.value = categoria.id
  nombreFormulario.value = categoria.nombre
  errorPanel.value = null
  panelAbierto.value = true
}

async function guardarCategoria(): Promise<void> {
  errorPanel.value = null
  try {
    if (idEnEdicion.value === null) {
      await tienda.crearCategoria(nombreFormulario.value)
    } else {
      await tienda.actualizarCategoria(idEnEdicion.value, nombreFormulario.value)
    }
    panelAbierto.value = false
  } catch (motivo) {
    errorPanel.value = (motivo as Error).message
  }
}

function etiquetaElemento(cantidad: number, singular: string, plural: string): string {
  return cantidad === 1 ? singular : plural
}

async function dependenciasDeCategoria(id: number): Promise<Dependencia[]> {
  const dependencias = await tienda.obtenerDependenciasCategoria(id)
  const items: Dependencia[] = []
  if (dependencias.subcategorias > 0) {
    items.push({
      etiqueta: etiquetaElemento(dependencias.subcategorias, 'subcategoría', 'subcategorías'),
      cantidad: dependencias.subcategorias,
    })
  }
  if (dependencias.movimientos > 0) {
    items.push({
      etiqueta: etiquetaElemento(dependencias.movimientos, 'movimiento', 'movimientos'),
      cantidad: dependencias.movimientos,
    })
  }
  if (dependencias.conceptos_previstos > 0) {
    items.push({
      etiqueta: etiquetaElemento(
        dependencias.conceptos_previstos,
        'concepto previsto',
        'conceptos previstos',
      ),
      cantidad: dependencias.conceptos_previstos,
    })
  }
  return items
}

async function dependenciasDeSubcategoria(
  idCategoria: number,
  idSubcategoria: number,
): Promise<Dependencia[]> {
  const dependencias = await tienda.obtenerDependenciasSubcategoria(idCategoria, idSubcategoria)
  const items: Dependencia[] = [
    {
      etiqueta: etiquetaElemento(dependencias.movimientos, 'movimiento', 'movimientos'),
      cantidad: dependencias.movimientos,
    },
  ]
  if (dependencias.conceptos_previstos > 0) {
    items.push({
      etiqueta: etiquetaElemento(
        dependencias.conceptos_previstos,
        'concepto previsto',
        'conceptos previstos',
      ),
      cantidad: dependencias.conceptos_previstos,
    })
  }
  return items
}

function nombreCuentaPorId(id: number): string {
  const cuenta = tiendaCuentas.cuentas.find((c) => c.id === id)
  return cuenta ? (cuenta.alias ?? cuenta.numero_cuenta) : ''
}

const COLUMNAS_DETALLES_MOVIMIENTOS = [
  'Fecha',
  'Cuenta',
  'Categoría',
  'Subcategoría',
  'Descripción',
  'Importe',
  'Saldo',
]

function filasDetalleDeMovimientos(
  movimientos: Movimiento[],
  nombreCategoria: string,
  nombreSubcategoria: string,
): (string | number)[][] {
  return movimientos.map((m) => [
    formatearFecha(m.fecha_valor),
    nombreCuentaPorId(m.cuenta_id),
    nombreCategoria,
    nombreSubcategoria,
    m.descripcion,
    formatearImporte(m.importe),
    formatearImporte(m.saldo),
  ])
}

// Se consulta directamente vía clienteApi (no a través del store de
// movimientos) para no pisar el estado global de `movimientos`, que otras
// vistas usan para su propio listado.
async function movimientosDeSubcategoria(idSubcategoria: number): Promise<Movimiento[]> {
  return clienteApi.obtener<Movimiento[]>(`/movimientos?subcategoria_id=${idSubcategoria}`)
}

async function filasDetalleDeSubcategoria(
  idSubcategoria: number,
  nombreCategoria: string,
  nombreSubcategoria: string,
): Promise<(string | number)[][]> {
  const movimientos = await movimientosDeSubcategoria(idSubcategoria)
  return filasDetalleDeMovimientos(movimientos, nombreCategoria, nombreSubcategoria)
}

async function eliminarCategoria(id: number, cascada = false): Promise<void> {
  error.value = null
  try {
    await tienda.eliminarCategoria(id, cascada)
    seleccionadas.value.delete(id)
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

async function dependenciasDeSeleccionadas(): Promise<Dependencia[]> {
  const resultados = await Promise.all(
    [...seleccionadas.value].map((id) => tienda.obtenerDependenciasCategoria(id)),
  )
  const totalSubcategorias = resultados.reduce((suma, d) => suma + d.subcategorias, 0)
  const totalMovimientos = resultados.reduce((suma, d) => suma + d.movimientos, 0)
  const totalConceptosPrevistos = resultados.reduce((suma, d) => suma + d.conceptos_previstos, 0)
  const items: Dependencia[] = []
  if (totalSubcategorias > 0) {
    items.push({
      etiqueta: etiquetaElemento(totalSubcategorias, 'subcategoría', 'subcategorías'),
      cantidad: totalSubcategorias,
    })
  }
  if (totalMovimientos > 0) {
    items.push({
      etiqueta: etiquetaElemento(totalMovimientos, 'movimiento', 'movimientos'),
      cantidad: totalMovimientos,
    })
  }
  if (totalConceptosPrevistos > 0) {
    items.push({
      etiqueta: etiquetaElemento(
        totalConceptosPrevistos,
        'concepto previsto',
        'conceptos previstos',
      ),
      cantidad: totalConceptosPrevistos,
    })
  }
  return items
}

async function eliminarSeleccionadas(cascada = false): Promise<void> {
  error.value = null
  try {
    const tareas = progresoEliminacion.envolver(
      [...seleccionadas.value].map((id) => () => tienda.eliminarCategoria(id, cascada)),
    )
    await Promise.all(tareas.map((tarea) => tarea()))
    seleccionadas.value.clear()
  } catch (motivo) {
    error.value = (motivo as Error).message
  } finally {
    progresoEliminacion.terminar()
  }
}

function alternarSeleccionTodas(marcado: boolean): void {
  seleccionadas.value = marcado
    ? new Set(filasFiltradas.value.map((c) => c.categoria.id))
    : new Set()
}

function alternarSeleccion(id: number, marcado: boolean): void {
  const nuevaSeleccion = new Set(seleccionadas.value)
  if (marcado) nuevaSeleccion.add(id)
  else nuevaSeleccion.delete(id)
  seleccionadas.value = nuevaSeleccion
}

async function crearSubcategoria(idCategoria: number): Promise<void> {
  error.value = null
  const nombre = subcategoriaNuevaPorCategoria.value[idCategoria]
  if (!nombre) return
  try {
    await tienda.crearSubcategoria(idCategoria, nombre)
    subcategoriaNuevaPorCategoria.value[idCategoria] = ''
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

async function eliminarSubcategoria(
  idCategoria: number,
  idSubcategoria: number,
  cascada = false,
): Promise<void> {
  error.value = null
  try {
    await tienda.eliminarSubcategoria(idCategoria, idSubcategoria, cascada)
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

function abrirParaEditarSubcategoria(idCategoria: number, sub: Subcategoria): void {
  subcategoriaEnEdicion.value = { id: sub.id, categoriaOrigenId: idCategoria }
  nombreSubcategoriaFormulario.value = sub.nombre
  categoriaDestinoFormulario.value = String(idCategoria)
  errorPanelSubcategoria.value = null
  panelSubcategoriaAbierto.value = true
}

async function guardarSubcategoria(): Promise<void> {
  if (subcategoriaEnEdicion.value === null || categoriaDestinoFormulario.value === undefined) {
    return
  }
  errorPanelSubcategoria.value = null
  try {
    await tienda.actualizarSubcategoria(
      subcategoriaEnEdicion.value.categoriaOrigenId,
      subcategoriaEnEdicion.value.id,
      nombreSubcategoriaFormulario.value,
      Number(categoriaDestinoFormulario.value),
    )
    panelSubcategoriaAbierto.value = false
  } catch (motivo) {
    errorPanelSubcategoria.value = (motivo as Error).message
  }
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Categorías</h2>
      <Button variant="success" @click="abrirParaCrear">Crear categoría</Button>
    </div>

    <ModalProgresoBloqueante
      v-if="progresoEliminacion.enCurso.value"
      titulo="Eliminando categorías"
      etiqueta-unidad="categorías"
      :progreso="{
        procesadas: progresoEliminacion.procesadas.value,
        total: progresoEliminacion.total.value,
      }"
    />

    <p class="text-muted-foreground mt-1 text-sm">
      {{ filasFiltradas.length }} categoría{{ filasFiltradas.length === 1 ? '' : 's' }}
    </p>

    <Sheet v-model:open="panelAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{{
            idEnEdicion === null ? 'Crear categoría' : 'Editar categoría'
          }}</SheetTitle>
        </SheetHeader>

        <form class="flex flex-col gap-3 px-4" @submit.prevent="guardarCategoria">
          <div class="flex flex-col gap-1.5">
            <Label for="nombre-categoria">Nombre</Label>
            <Input
              id="nombre-categoria"
              v-model="nombreFormulario"
              placeholder="Nueva categoría"
              required
            />
          </div>

          <p v-if="errorPanel" class="text-sm text-destructive" role="alert">{{ errorPanel }}</p>

          <div class="flex gap-2">
            <Button type="submit" variant="success">
              {{ idEnEdicion === null ? 'Crear categoría' : 'Guardar cambios' }}
            </Button>
            <Button type="button" variant="destructive" @click="panelAbierto = false"
              >Cancelar</Button
            >
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <p v-if="error" class="mt-2 text-sm text-destructive" role="alert">{{ error }}</p>

    <div class="mt-6 flex items-center gap-2 text-sm">
      <Checkbox
        :model-value="todasSeleccionadas"
        aria-label="Seleccionar todas las categorías"
        @update:model-value="(valor) => alternarSeleccionTodas(valor === true)"
      />
      <span>Seleccionar todas</span>
    </div>

    <div
      v-if="seleccionadas.size > 0"
      class="mt-2 flex items-center gap-3 rounded-lg border p-2 text-sm"
    >
      <span>{{ seleccionadas.size }} seleccionados</span>
      <DialogoConfirmarEliminacion
        :descripcion="`${seleccionadas.size} categorías seleccionadas`"
        texto-boton="Eliminar seleccionados"
        disparador-solido
        :obtener-dependencias="dependenciasDeSeleccionadas"
        @confirmar="(cascada) => eliminarSeleccionadas(cascada)"
      />
    </div>

    <div class="bg-muted/40 mt-4 flex flex-col gap-4 rounded-lg border p-4">
      <Collapsible v-model:open="filtrosAbiertos">
        <CollapsibleTrigger
          class="text-muted-foreground flex items-center gap-1 text-sm font-medium"
          :aria-label="filtrosAbiertos ? 'Contraer filtros' : 'Expandir filtros'"
        >
          <ChevronRight
            class="size-4 transition-transform"
            :class="filtrosAbiertos ? 'rotate-90' : ''"
          />
          Filtros
        </CollapsibleTrigger>
        <CollapsibleContent class="mt-4 flex flex-wrap items-end gap-4">
          <div class="flex max-w-xs flex-col gap-1.5">
            <Label for="buscar-categorias">Buscar</Label>
            <div class="relative">
              <Search
                class="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4"
              />
              <Input
                id="buscar-categorias"
                v-model="busqueda"
                placeholder="Buscar categorías…"
                class="pl-8"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>

    <div class="mt-4 space-y-4">
      <Card v-for="item in filasFiltradas" :key="item.categoria.id">
        <Collapsible
          :open="categoriaAbierta(item.categoria.id)"
          @update:open="(abierta) => alternarCategoria(item.categoria.id, abierta)"
        >
          <CardHeader class="flex flex-row items-center justify-between">
            <div class="flex items-center gap-2">
              <CollapsibleTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  :aria-label="
                    categoriaAbierta(item.categoria.id)
                      ? `Contraer ${item.categoria.nombre}`
                      : `Expandir ${item.categoria.nombre}`
                  "
                >
                  <ChevronRight
                    class="size-4 transition-transform"
                    :class="categoriaAbierta(item.categoria.id) ? 'rotate-90' : ''"
                  />
                </Button>
              </CollapsibleTrigger>
              <Checkbox
                :model-value="seleccionadas.has(item.categoria.id)"
                :aria-label="`Seleccionar la categoría ${item.categoria.nombre}`"
                @update:model-value="
                  (valor) => alternarSeleccion(item.categoria.id, valor === true)
                "
              />
              <CardTitle>{{ item.categoria.nombre }}</CardTitle>
              <span class="text-muted-foreground text-sm">
                ({{ item.subcategorias.length }} subcategoría{{
                  item.subcategorias.length === 1 ? '' : 's'
                }})
              </span>
            </div>
            <div class="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                @click="abrirParaEditar(item.categoria)"
              >
                <Pencil class="size-4" />
              </Button>
              <DialogoConfirmarEliminacion
                :descripcion="`la categoría ${item.categoria.nombre}`"
                texto-boton="Eliminar categoría"
                :obtener-dependencias="() => dependenciasDeCategoria(item.categoria.id)"
                @confirmar="(cascada) => eliminarCategoria(item.categoria.id, cascada)"
              />
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent>
              <ul class="flex flex-wrap gap-2">
                <li v-for="sub in item.subcategorias" :key="sub.id">
                  <Badge variant="secondary" class="gap-1 py-1 pr-1 pl-3 text-sm font-normal">
                    <span>{{ sub.nombre }}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-4 rounded-full hover:bg-background/60"
                      aria-label="Editar"
                      @click="abrirParaEditarSubcategoria(item.categoria.id, sub)"
                    >
                      <Pencil class="size-3" />
                    </Button>
                    <DialogoConfirmarEliminacion
                      :descripcion="`la subcategoría ${sub.nombre}`"
                      :obtener-dependencias="
                        () => dependenciasDeSubcategoria(item.categoria.id, sub.id)
                      "
                      titulo-detalles="Movimientos que se eliminarán"
                      :columnas-detalles="COLUMNAS_DETALLES_MOVIMIENTOS"
                      :obtener-filas-detalles="
                        () => filasDetalleDeSubcategoria(sub.id, item.categoria.nombre, sub.nombre)
                      "
                      @confirmar="
                        (cascada) => eliminarSubcategoria(item.categoria.id, sub.id, cascada)
                      "
                    >
                      <template #disparador>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-4 rounded-full hover:bg-background/60"
                          aria-label="Eliminar"
                        >
                          <X class="size-3" />
                        </Button>
                      </template>
                    </DialogoConfirmarEliminacion>
                  </Badge>
                </li>
              </ul>

              <form class="mt-3 flex gap-2" @submit.prevent="crearSubcategoria(item.categoria.id)">
                <Input
                  v-model="subcategoriaNuevaPorCategoria[item.categoria.id]"
                  placeholder="Nueva subcategoría"
                  class="max-w-xs"
                />
                <Button type="submit" variant="success">Añadir</Button>
              </form>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>

    <Sheet v-model:open="panelSubcategoriaAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar subcategoría</SheetTitle>
        </SheetHeader>

        <form class="flex flex-col gap-3 px-4" @submit.prevent="guardarSubcategoria">
          <div class="flex flex-col gap-1.5">
            <Label for="nombre-subcategoria">Nombre</Label>
            <Input
              id="nombre-subcategoria"
              v-model="nombreSubcategoriaFormulario"
              placeholder="Nombre de la subcategoría"
              required
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label id="etiqueta-categoria-subcategoria" for="selector-categoria-subcategoria"
              >Categoría</Label
            >
            <Select v-model="categoriaDestinoFormulario">
              <SelectTrigger
                id="selector-categoria-subcategoria"
                aria-labelledby="etiqueta-categoria-subcategoria"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="cat in tienda.categorias"
                  :key="cat.categoria.id"
                  :value="String(cat.categoria.id)"
                >
                  {{ cat.categoria.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p v-if="errorPanelSubcategoria" class="text-sm text-destructive" role="alert">
            {{ errorPanelSubcategoria }}
          </p>

          <div class="flex gap-2">
            <Button type="submit" variant="success">Guardar cambios</Button>
            <Button type="button" variant="destructive" @click="panelSubcategoriaAbierto = false"
              >Cancelar</Button
            >
          </div>
        </form>
      </SheetContent>
    </Sheet>
  </section>
</template>
