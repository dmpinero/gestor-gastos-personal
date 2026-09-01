<script setup lang="ts">
import { ArrowRight, ChevronRight, Link2, Pencil, Trash2 } from '@lucide/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import type { AsociacionConcepto, AsociacionDescripcion, ConceptoPrevisto } from '@/api/tipos'
import { useTiendaAsociaciones } from '@/stores/asociaciones'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaPrevisiones } from '@/stores/previsiones'
import DialogoConfirmarEliminacion from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'
import { Button } from '@/componentes/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from '@/componentes/ui/combobox'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/componentes/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'

const tiendaAsociaciones = useTiendaAsociaciones()
const tiendaCategorias = useTiendaCategorias()
const tiendaPrevisiones = useTiendaPrevisiones()

onMounted(() => {
  tiendaAsociaciones.cargar()
  tiendaCategorias.cargar()
  tiendaPrevisiones.cargar()
})

function nombreCategoria(idCategoria: number): string {
  return (
    tiendaCategorias.categorias.find((c) => c.categoria.id === idCategoria)?.categoria.nombre ?? ''
  )
}

function nombreSubcategoria(idSubcategoria: number | null): string {
  if (idSubcategoria === null) return ''
  for (const c of tiendaCategorias.categorias) {
    const sub = c.subcategorias.find((s) => s.id === idSubcategoria)
    if (sub) return sub.nombre
  }
  return ''
}

// Mismo criterio que el backend para nombrar un concepto: la subcategoría
// si la tiene, si no el nombre de la categoría (ver ObtenerResumenAnual).
function nombreConcepto(idCategoria: number, idSubcategoria: number | null): string {
  return nombreSubcategoria(idSubcategoria) || nombreCategoria(idCategoria)
}

const SIN_SUBCATEGORIA = 'sin-subcategoria'

const formulario = reactive({
  categoriaResumenId: '',
  subcategoriaResumenId: SIN_SUBCATEGORIA,
  categoriaMovimientoId: '',
  subcategoriaMovimientoId: SIN_SUBCATEGORIA,
})

const formularioDescripcion = reactive({
  categoriaResumenId: '',
  subcategoriaResumenId: SIN_SUBCATEGORIA,
  descripcion: '',
})

function subcategoriasDe(idCategoriaTexto: string) {
  const categoria = tiendaCategorias.categorias.find(
    (c) => c.categoria.id === Number(idCategoriaTexto),
  )
  return categoria?.subcategorias ?? []
}

const subcategoriasDelResumen = computed(() => subcategoriasDe(formulario.categoriaResumenId))
const subcategoriasDelMovimiento = computed(() => subcategoriasDe(formulario.categoriaMovimientoId))
const subcategoriasDelResumenDescripcion = computed(() =>
  subcategoriasDe(formularioDescripcion.categoriaResumenId),
)

// display-value de los Combobox: qué texto se muestra en el input para el
// valor actualmente seleccionado (los propios <ComboboxItem> solo aportan el
// texto que se busca al escribir).
function mostrarCategoria(valor: string): string {
  return nombreCategoria(Number(valor))
}

function mostrarSubcategoria(valor: string): string {
  return valor === SIN_SUBCATEGORIA ? '(sin subcategoría)' : nombreSubcategoria(Number(valor))
}

const errorFormulario = computed(() => tiendaAsociaciones.error)

function limpiarFormulario(): void {
  formulario.categoriaResumenId = ''
  formulario.subcategoriaResumenId = SIN_SUBCATEGORIA
  formulario.categoriaMovimientoId = ''
  formulario.subcategoriaMovimientoId = SIN_SUBCATEGORIA
}

function limpiarFormularioDescripcion(): void {
  formularioDescripcion.categoriaResumenId = ''
  formularioDescripcion.subcategoriaResumenId = SIN_SUBCATEGORIA
  formularioDescripcion.descripcion = ''
}

function usarConceptoSinAsociar(idCategoria: number, idSubcategoria: number | null): void {
  formulario.categoriaResumenId = String(idCategoria)
  formulario.subcategoriaResumenId =
    idSubcategoria === null ? SIN_SUBCATEGORIA : String(idSubcategoria)
}

// El formulario tiene dos formas alternativas de crear una asociación (por
// categoría de movimientos o por descripción); un único botón crea la que
// esté rellena, priorizando la descripción si ambas lo están.
const formularioListo = computed(
  () =>
    (formulario.categoriaResumenId && formulario.categoriaMovimientoId) ||
    (formularioDescripcion.categoriaResumenId && formularioDescripcion.descripcion.trim()),
)

async function crearAsociacion(): Promise<void> {
  tiendaAsociaciones.error = null
  try {
    if (formularioDescripcion.descripcion.trim()) {
      await tiendaAsociaciones.crearDescripcion({
        categoria_resumen_id: Number(formularioDescripcion.categoriaResumenId),
        subcategoria_resumen_id:
          formularioDescripcion.subcategoriaResumenId === SIN_SUBCATEGORIA
            ? null
            : Number(formularioDescripcion.subcategoriaResumenId),
        descripcion: formularioDescripcion.descripcion.trim(),
      })
    } else {
      await tiendaAsociaciones.crear({
        categoria_resumen_id: Number(formulario.categoriaResumenId),
        subcategoria_resumen_id:
          formulario.subcategoriaResumenId === SIN_SUBCATEGORIA
            ? null
            : Number(formulario.subcategoriaResumenId),
        categoria_movimiento_id: Number(formulario.categoriaMovimientoId),
        subcategoria_movimiento_id:
          formulario.subcategoriaMovimientoId === SIN_SUBCATEGORIA
            ? null
            : Number(formulario.subcategoriaMovimientoId),
      })
    }
    limpiarFormulario()
    limpiarFormularioDescripcion()
  } catch {
    // El error ya queda reflejado en tiendaAsociaciones.error.
  }
}

// Editar una asociación se hace en un panel modal aparte (no reutilizando el
// formulario de arriba): así se evita cualquier desplazamiento de la página
// al pulsar "Editar" en una fila de la tabla, que puede quedar lejos del
// formulario de creación.
const panelEdicionAbierto = ref(false)
const edicion = ref<{ tipo: 'categoria' | 'descripcion'; id: number } | null>(null)

const formularioEdicion = reactive({
  categoriaResumenId: '',
  subcategoriaResumenId: SIN_SUBCATEGORIA,
  categoriaMovimientoId: '',
  subcategoriaMovimientoId: SIN_SUBCATEGORIA,
  descripcion: '',
})

const subcategoriasDelResumenEdicion = computed(() =>
  subcategoriasDe(formularioEdicion.categoriaResumenId),
)
const subcategoriasDelMovimientoEdicion = computed(() =>
  subcategoriasDe(formularioEdicion.categoriaMovimientoId),
)

const formularioEdicionListo = computed(() => {
  if (edicion.value?.tipo === 'categoria') {
    return Boolean(formularioEdicion.categoriaResumenId && formularioEdicion.categoriaMovimientoId)
  }
  if (edicion.value?.tipo === 'descripcion') {
    return Boolean(formularioEdicion.categoriaResumenId && formularioEdicion.descripcion.trim())
  }
  return false
})

function editarAsociacion(asociacion: AsociacionConcepto): void {
  formularioEdicion.categoriaResumenId = String(asociacion.categoria_resumen_id)
  formularioEdicion.subcategoriaResumenId =
    asociacion.subcategoria_resumen_id === null
      ? SIN_SUBCATEGORIA
      : String(asociacion.subcategoria_resumen_id)
  formularioEdicion.categoriaMovimientoId = String(asociacion.categoria_movimiento_id)
  formularioEdicion.subcategoriaMovimientoId =
    asociacion.subcategoria_movimiento_id === null
      ? SIN_SUBCATEGORIA
      : String(asociacion.subcategoria_movimiento_id)
  edicion.value = { tipo: 'categoria', id: asociacion.id }
  tiendaAsociaciones.error = null
  panelEdicionAbierto.value = true
}

function editarAsociacionDescripcion(asociacion: AsociacionDescripcion): void {
  formularioEdicion.categoriaResumenId = String(asociacion.categoria_resumen_id)
  formularioEdicion.subcategoriaResumenId =
    asociacion.subcategoria_resumen_id === null
      ? SIN_SUBCATEGORIA
      : String(asociacion.subcategoria_resumen_id)
  formularioEdicion.descripcion = asociacion.descripcion
  edicion.value = { tipo: 'descripcion', id: asociacion.id }
  tiendaAsociaciones.error = null
  panelEdicionAbierto.value = true
}

function cancelarEdicion(): void {
  panelEdicionAbierto.value = false
  edicion.value = null
  tiendaAsociaciones.error = null
}

async function guardarEdicion(): Promise<void> {
  if (!edicion.value) return
  tiendaAsociaciones.error = null
  try {
    if (edicion.value.tipo === 'categoria') {
      await tiendaAsociaciones.actualizar(edicion.value.id, {
        categoria_resumen_id: Number(formularioEdicion.categoriaResumenId),
        subcategoria_resumen_id:
          formularioEdicion.subcategoriaResumenId === SIN_SUBCATEGORIA
            ? null
            : Number(formularioEdicion.subcategoriaResumenId),
        categoria_movimiento_id: Number(formularioEdicion.categoriaMovimientoId),
        subcategoria_movimiento_id:
          formularioEdicion.subcategoriaMovimientoId === SIN_SUBCATEGORIA
            ? null
            : Number(formularioEdicion.subcategoriaMovimientoId),
      })
    } else {
      await tiendaAsociaciones.actualizarDescripcion(edicion.value.id, {
        categoria_resumen_id: Number(formularioEdicion.categoriaResumenId),
        subcategoria_resumen_id:
          formularioEdicion.subcategoriaResumenId === SIN_SUBCATEGORIA
            ? null
            : Number(formularioEdicion.subcategoriaResumenId),
        descripcion: formularioEdicion.descripcion.trim(),
      })
    }
    panelEdicionAbierto.value = false
    edicion.value = null
  } catch {
    // El error ya queda reflejado en tiendaAsociaciones.error.
  }
}

async function eliminarAsociacion(id: number): Promise<void> {
  await tiendaAsociaciones.eliminar(id)
}

async function eliminarAsociacionDescripcion(id: number): Promise<void> {
  await tiendaAsociaciones.eliminarDescripcion(id)
}

// Conceptos previstos del resumen anual cuya categoría/subcategoría todavía
// no tiene una asociación creada: ayuda a encontrar qué falta mapear.
const conceptosSinAsociar = computed(() => {
  const clavesAsociadas = new Set([
    ...tiendaAsociaciones.asociaciones.map(
      (a) => `${a.categoria_resumen_id}:${a.subcategoria_resumen_id}`,
    ),
    ...tiendaAsociaciones.asociacionesDescripcion.map(
      (a) => `${a.categoria_resumen_id}:${a.subcategoria_resumen_id}`,
    ),
  ])
  const vistos = new Set<string>()
  return tiendaPrevisiones.conceptos.filter((c) => {
    const clave = `${c.categoria_id}:${c.subcategoria_id}`
    if (clavesAsociadas.has(clave) || vistos.has(clave)) return false
    vistos.add(clave)
    return true
  })
})

interface GrupoConceptosSinAsociar {
  categoriaId: number
  nombre: string
  conceptos: ConceptoPrevisto[]
}

// Agrupa los conceptos sin asociar por categoría, para poder mostrarlos como
// una fila de categoría con sus conceptos debajo, en vez de una lista plana.
const gruposConceptosSinAsociar = computed<GrupoConceptosSinAsociar[]>(() => {
  const grupos = new Map<number, GrupoConceptosSinAsociar>()
  for (const concepto of conceptosSinAsociar.value) {
    let grupo = grupos.get(concepto.categoria_id)
    if (!grupo) {
      grupo = {
        categoriaId: concepto.categoria_id,
        nombre: nombreCategoria(concepto.categoria_id),
        conceptos: [],
      }
      grupos.set(concepto.categoria_id, grupo)
    }
    grupo.conceptos.push(concepto)
  }
  return [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
})

const categoriasSinAsociarAbiertas = ref<Set<number>>(new Set())

function alternarCategoriaSinAsociar(idCategoria: number): void {
  const nuevo = new Set(categoriasSinAsociarAbiertas.value)
  if (nuevo.has(idCategoria)) nuevo.delete(idCategoria)
  else nuevo.add(idCategoria)
  categoriasSinAsociarAbiertas.value = nuevo
}
</script>

<template>
  <section>
    <p class="text-muted-foreground max-w-prose text-sm">
      Algunos conceptos del Resumen anual se nombran de forma distinta a la categoría real que usan
      los movimientos (por ejemplo, "Comida" en el resumen anual y "Alimentación" en movimientos).
      Crea aquí la correspondencia entre ambos para que el Resumen anual encuentre el importe real
      de esos conceptos. Para movimientos sueltos que no comparten categoría con ningún otro (p. ej.
      un recibo con descripción propia), asócialos directamente por su descripción en vez de por
      categoría.
    </p>

    <form
      class="bg-muted/40 mt-4 flex flex-col gap-4 rounded-lg border p-4"
      @submit.prevent="crearAsociacion"
    >
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div class="flex flex-1 flex-wrap gap-4">
          <div class="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label id="etiqueta-categoria-movimiento" for="selector-categoria-movimiento"
              >Categoría real de Movimientos</Label
            >
            <Combobox v-model="formulario.categoriaMovimientoId" open-on-click open-on-focus>
              <ComboboxTrigger class="w-full">
                <ComboboxInput
                  id="selector-categoria-movimiento"
                  aria-labelledby="etiqueta-categoria-movimiento"
                  placeholder="Selecciona o escribe para buscar"
                  :display-value="mostrarCategoria"
                />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                <ComboboxItem
                  v-for="item in tiendaCategorias.categorias"
                  :key="item.categoria.id"
                  :value="String(item.categoria.id)"
                >
                  {{ item.categoria.nombre }}
                </ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>

          <div class="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label id="etiqueta-subcategoria-movimiento" for="selector-subcategoria-movimiento"
              >Subcategoría real de Movimientos</Label
            >
            <Combobox v-model="formulario.subcategoriaMovimientoId" open-on-click open-on-focus>
              <ComboboxTrigger class="w-full">
                <ComboboxInput
                  id="selector-subcategoria-movimiento"
                  aria-labelledby="etiqueta-subcategoria-movimiento"
                  placeholder="Selecciona o escribe para buscar"
                  :display-value="mostrarSubcategoria"
                />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                <ComboboxItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</ComboboxItem>
                <ComboboxItem
                  v-for="s in subcategoriasDelMovimiento"
                  :key="s.id"
                  :value="String(s.id)"
                >
                  {{ s.nombre }}
                </ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>

        <ArrowRight class="text-muted-foreground mb-2.5 size-5 shrink-0 self-center md:self-auto" />

        <div class="flex flex-1 flex-wrap gap-4">
          <div class="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label id="etiqueta-categoria-resumen" for="selector-categoria-resumen"
              >Categoría del Resumen anual</Label
            >
            <Combobox v-model="formulario.categoriaResumenId" open-on-click open-on-focus>
              <ComboboxTrigger class="w-full">
                <ComboboxInput
                  id="selector-categoria-resumen"
                  aria-labelledby="etiqueta-categoria-resumen"
                  placeholder="Selecciona o escribe para buscar"
                  :display-value="mostrarCategoria"
                />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                <ComboboxItem
                  v-for="item in tiendaCategorias.categorias"
                  :key="item.categoria.id"
                  :value="String(item.categoria.id)"
                >
                  {{ item.categoria.nombre }}
                </ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>

          <div class="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label id="etiqueta-subcategoria-resumen" for="selector-subcategoria-resumen"
              >Subcategoría del Resumen anual</Label
            >
            <Combobox v-model="formulario.subcategoriaResumenId" open-on-click open-on-focus>
              <ComboboxTrigger class="w-full">
                <ComboboxInput
                  id="selector-subcategoria-resumen"
                  aria-labelledby="etiqueta-subcategoria-resumen"
                  placeholder="Selecciona o escribe para buscar"
                  :display-value="mostrarSubcategoria"
                />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                <ComboboxItem
                  v-for="s in subcategoriasDelResumen"
                  :key="s.id"
                  :value="String(s.id)"
                >
                  {{ s.nombre }}
                </ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4 border-t pt-4 md:flex-row md:items-end">
        <div class="flex flex-1 flex-col gap-1.5">
          <Label id="etiqueta-descripcion-movimiento" for="input-descripcion-movimiento"
            >Descripción de Movimientos (contiene)</Label
          >
          <Input
            id="input-descripcion-movimiento"
            v-model="formularioDescripcion.descripcion"
            aria-labelledby="etiqueta-descripcion-movimiento"
            placeholder="p. ej. Ayuntamiento Las Rozas"
          />
        </div>

        <ArrowRight class="text-muted-foreground mb-2.5 size-5 shrink-0 self-center md:self-auto" />

        <div class="flex flex-1 flex-wrap gap-4">
          <div class="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label
              id="etiqueta-categoria-resumen-descripcion"
              for="selector-categoria-resumen-descripcion"
              >Categoría del Resumen anual (para esta descripción)</Label
            >
            <Combobox
              v-model="formularioDescripcion.categoriaResumenId"
              open-on-click
              open-on-focus
            >
              <ComboboxTrigger class="w-full">
                <ComboboxInput
                  id="selector-categoria-resumen-descripcion"
                  aria-labelledby="etiqueta-categoria-resumen-descripcion"
                  placeholder="Selecciona o escribe para buscar"
                  :display-value="mostrarCategoria"
                />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                <ComboboxItem
                  v-for="item in tiendaCategorias.categorias"
                  :key="item.categoria.id"
                  :value="String(item.categoria.id)"
                >
                  {{ item.categoria.nombre }}
                </ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>

          <div class="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label
              id="etiqueta-subcategoria-resumen-descripcion"
              for="selector-subcategoria-resumen-descripcion"
              >Subcategoría del Resumen anual (para esta descripción)</Label
            >
            <Combobox
              v-model="formularioDescripcion.subcategoriaResumenId"
              open-on-click
              open-on-focus
            >
              <ComboboxTrigger class="w-full">
                <ComboboxInput
                  id="selector-subcategoria-resumen-descripcion"
                  aria-labelledby="etiqueta-subcategoria-resumen-descripcion"
                  placeholder="Selecciona o escribe para buscar"
                  :display-value="mostrarSubcategoria"
                />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                <ComboboxItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</ComboboxItem>
                <ComboboxItem
                  v-for="s in subcategoriasDelResumenDescripcion"
                  :key="s.id"
                  :value="String(s.id)"
                >
                  {{ s.nombre }}
                </ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" variant="success" :disabled="!formularioListo">
          <Link2 class="size-4" />
          Crear asociación
        </Button>
      </div>
    </form>

    <p v-if="errorFormulario" class="mt-2 text-sm text-destructive" role="alert">
      {{ errorFormulario }}
    </p>

    <div v-if="conceptosSinAsociar.length > 0" class="mt-6">
      <h3 class="text-muted-foreground text-sm font-medium">
        Conceptos del Resumen anual sin asociar
      </h3>
      <div class="mt-2 flex flex-col gap-2">
        <div
          v-for="grupo in gruposConceptosSinAsociar"
          :key="grupo.categoriaId"
          class="overflow-hidden rounded-lg border"
        >
          <button
            type="button"
            class="hover:bg-muted/50 flex w-full items-center gap-3 p-2 text-left"
            :aria-expanded="categoriasSinAsociarAbiertas.has(grupo.categoriaId)"
            @click="alternarCategoriaSinAsociar(grupo.categoriaId)"
          >
            <ChevronRight
              class="size-4 shrink-0 transition-transform"
              :class="categoriasSinAsociarAbiertas.has(grupo.categoriaId) ? 'rotate-90' : ''"
            />
            <span class="flex-1 truncate font-medium">{{ grupo.nombre }}</span>
            <span class="text-muted-foreground text-sm"
              >{{ grupo.conceptos.length }} concepto(s)</span
            >
          </button>

          <ul v-if="categoriasSinAsociarAbiertas.has(grupo.categoriaId)" class="divide-y border-t">
            <li v-for="concepto in grupo.conceptos" :key="concepto.id">
              <button
                type="button"
                class="hover:bg-muted/50 flex w-full items-center px-3 py-2 pl-9 text-left text-sm"
                @click="usarConceptoSinAsociar(concepto.categoria_id, concepto.subcategoria_id)"
              >
                {{ nombreConcepto(concepto.categoria_id, concepto.subcategoria_id) }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="text-muted-foreground text-sm font-medium">Asociaciones creadas</h3>
      <p
        v-if="tiendaAsociaciones.asociaciones.length === 0"
        class="text-muted-foreground mt-2 text-sm"
      >
        Todavía no has creado ninguna asociación.
      </p>
      <div v-else class="mt-2 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto del Resumen anual</TableHead>
              <TableHead>Categoría real de Movimientos</TableHead>
              <TableHead class="w-9"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="asociacion in tiendaAsociaciones.asociaciones" :key="asociacion.id">
              <TableCell>
                {{
                  nombreConcepto(
                    asociacion.categoria_resumen_id,
                    asociacion.subcategoria_resumen_id,
                  )
                }}
              </TableCell>
              <TableCell>
                {{
                  nombreConcepto(
                    asociacion.categoria_movimiento_id,
                    asociacion.subcategoria_movimiento_id,
                  )
                }}
              </TableCell>
              <TableCell class="text-right whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar"
                  @click="editarAsociacion(asociacion)"
                >
                  <Pencil class="size-4" />
                </Button>
                <DialogoConfirmarEliminacion
                  :descripcion="`esta asociación`"
                  @confirmar="eliminarAsociacion(asociacion.id)"
                >
                  <template #disparador>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-destructive"
                      aria-label="Eliminar"
                    >
                      <Trash2 class="size-4" />
                    </Button>
                  </template>
                </DialogoConfirmarEliminacion>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="text-muted-foreground text-sm font-medium">
        Asociaciones por descripción creadas
      </h3>
      <p
        v-if="tiendaAsociaciones.asociacionesDescripcion.length === 0"
        class="text-muted-foreground mt-2 text-sm"
      >
        Todavía no has creado ninguna asociación por descripción.
      </p>
      <div v-else class="mt-2 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto del Resumen anual</TableHead>
              <TableHead>Descripción de Movimientos contiene</TableHead>
              <TableHead class="w-9"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="asociacion in tiendaAsociaciones.asociacionesDescripcion"
              :key="asociacion.id"
            >
              <TableCell>
                {{
                  nombreConcepto(
                    asociacion.categoria_resumen_id,
                    asociacion.subcategoria_resumen_id,
                  )
                }}
              </TableCell>
              <TableCell>{{ asociacion.descripcion }}</TableCell>
              <TableCell class="text-right whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar"
                  @click="editarAsociacionDescripcion(asociacion)"
                >
                  <Pencil class="size-4" />
                </Button>
                <DialogoConfirmarEliminacion
                  :descripcion="`esta asociación`"
                  @confirmar="eliminarAsociacionDescripcion(asociacion.id)"
                >
                  <template #disparador>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-destructive"
                      aria-label="Eliminar"
                    >
                      <Trash2 class="size-4" />
                    </Button>
                  </template>
                </DialogoConfirmarEliminacion>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <Sheet v-model:open="panelEdicionAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {{
              edicion?.tipo === 'descripcion'
                ? 'Editar asociación por descripción'
                : 'Editar asociación por categoría'
            }}
          </SheetTitle>
        </SheetHeader>

        <form class="flex flex-col gap-4 px-4" @submit.prevent="guardarEdicion">
          <template v-if="edicion?.tipo === 'categoria'">
            <div class="flex flex-col gap-1.5">
              <Label
                id="etiqueta-categoria-movimiento-edicion"
                for="selector-categoria-movimiento-edicion"
                >Categoría real de Movimientos</Label
              >
              <Combobox
                v-model="formularioEdicion.categoriaMovimientoId"
                open-on-click
                open-on-focus
              >
                <ComboboxTrigger class="w-full">
                  <ComboboxInput
                    id="selector-categoria-movimiento-edicion"
                    aria-labelledby="etiqueta-categoria-movimiento-edicion"
                    placeholder="Selecciona o escribe para buscar"
                    :display-value="mostrarCategoria"
                  />
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                  <ComboboxItem
                    v-for="item in tiendaCategorias.categorias"
                    :key="item.categoria.id"
                    :value="String(item.categoria.id)"
                  >
                    {{ item.categoria.nombre }}
                  </ComboboxItem>
                </ComboboxContent>
              </Combobox>
            </div>

            <div class="flex flex-col gap-1.5">
              <Label
                id="etiqueta-subcategoria-movimiento-edicion"
                for="selector-subcategoria-movimiento-edicion"
                >Subcategoría real de Movimientos</Label
              >
              <Combobox
                v-model="formularioEdicion.subcategoriaMovimientoId"
                open-on-click
                open-on-focus
              >
                <ComboboxTrigger class="w-full">
                  <ComboboxInput
                    id="selector-subcategoria-movimiento-edicion"
                    aria-labelledby="etiqueta-subcategoria-movimiento-edicion"
                    placeholder="Selecciona o escribe para buscar"
                    :display-value="mostrarSubcategoria"
                  />
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                  <ComboboxItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</ComboboxItem>
                  <ComboboxItem
                    v-for="s in subcategoriasDelMovimientoEdicion"
                    :key="s.id"
                    :value="String(s.id)"
                  >
                    {{ s.nombre }}
                  </ComboboxItem>
                </ComboboxContent>
              </Combobox>
            </div>
          </template>

          <div v-else-if="edicion?.tipo === 'descripcion'" class="flex flex-col gap-1.5">
            <Label
              id="etiqueta-descripcion-movimiento-edicion"
              for="input-descripcion-movimiento-edicion"
              >Descripción de Movimientos (contiene)</Label
            >
            <Input
              id="input-descripcion-movimiento-edicion"
              v-model="formularioEdicion.descripcion"
              aria-labelledby="etiqueta-descripcion-movimiento-edicion"
              placeholder="p. ej. Ayuntamiento Las Rozas"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label id="etiqueta-categoria-resumen-edicion" for="selector-categoria-resumen-edicion"
              >Categoría del Resumen anual</Label
            >
            <Combobox v-model="formularioEdicion.categoriaResumenId" open-on-click open-on-focus>
              <ComboboxTrigger class="w-full">
                <ComboboxInput
                  id="selector-categoria-resumen-edicion"
                  aria-labelledby="etiqueta-categoria-resumen-edicion"
                  placeholder="Selecciona o escribe para buscar"
                  :display-value="mostrarCategoria"
                />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                <ComboboxItem
                  v-for="item in tiendaCategorias.categorias"
                  :key="item.categoria.id"
                  :value="String(item.categoria.id)"
                >
                  {{ item.categoria.nombre }}
                </ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label
              id="etiqueta-subcategoria-resumen-edicion"
              for="selector-subcategoria-resumen-edicion"
              >Subcategoría del Resumen anual</Label
            >
            <Combobox v-model="formularioEdicion.subcategoriaResumenId" open-on-click open-on-focus>
              <ComboboxTrigger class="w-full">
                <ComboboxInput
                  id="selector-subcategoria-resumen-edicion"
                  aria-labelledby="etiqueta-subcategoria-resumen-edicion"
                  placeholder="Selecciona o escribe para buscar"
                  :display-value="mostrarSubcategoria"
                />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
                <ComboboxItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</ComboboxItem>
                <ComboboxItem
                  v-for="s in subcategoriasDelResumenEdicion"
                  :key="s.id"
                  :value="String(s.id)"
                >
                  {{ s.nombre }}
                </ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </div>

          <p v-if="tiendaAsociaciones.error" class="text-sm text-destructive" role="alert">
            {{ tiendaAsociaciones.error }}
          </p>

          <div class="flex gap-2">
            <Button type="submit" variant="success" :disabled="!formularioEdicionListo">
              Guardar cambios
            </Button>
            <Button type="button" variant="destructive" @click="cancelarEdicion">Cancelar</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  </section>
</template>
