<script setup lang="ts">
import { Pencil, X } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'

import type { Categoria, Subcategoria } from '@/api/tipos'
import { useTiendaCategorias } from '@/stores/categorias'
import { Badge } from '@/componentes/ui/badge'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Checkbox } from '@/componentes/ui/checkbox'
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

const tienda = useTiendaCategorias()
const error = ref<string | null>(null)
const errorPanel = ref<string | null>(null)
const subcategoriaNuevaPorCategoria = ref<Record<number, string>>({})

const panelAbierto = ref(false)
const idEnEdicion = ref<number | null>(null)
const nombreFormulario = ref('')
const seleccionadas = ref<Set<number>>(new Set())

const panelSubcategoriaAbierto = ref(false)
const subcategoriaEnEdicion = ref<{ id: number; categoriaOrigenId: number } | null>(null)
const nombreSubcategoriaFormulario = ref('')
const categoriaDestinoFormulario = ref<string | undefined>(undefined)
const errorPanelSubcategoria = ref<string | null>(null)

const todasSeleccionadas = computed(
  () =>
    tienda.categorias.length > 0 &&
    tienda.categorias.every((c) => seleccionadas.value.has(c.categoria.id)),
)

onMounted(() => {
  tienda.cargar()
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
  return items
}

async function dependenciasDeSubcategoria(
  idCategoria: number,
  idSubcategoria: number,
): Promise<Dependencia[]> {
  const dependencias = await tienda.obtenerDependenciasSubcategoria(idCategoria, idSubcategoria)
  return [
    {
      etiqueta: etiquetaElemento(dependencias.movimientos, 'movimiento', 'movimientos'),
      cantidad: dependencias.movimientos,
    },
  ]
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
  return items
}

async function eliminarSeleccionadas(cascada = false): Promise<void> {
  error.value = null
  try {
    await Promise.all([...seleccionadas.value].map((id) => tienda.eliminarCategoria(id, cascada)))
    seleccionadas.value.clear()
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

function alternarSeleccionTodas(marcado: boolean): void {
  seleccionadas.value = marcado ? new Set(tienda.categorias.map((c) => c.categoria.id)) : new Set()
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
        :obtener-dependencias="dependenciasDeSeleccionadas"
        @confirmar="(cascada) => eliminarSeleccionadas(cascada)"
      />
    </div>

    <div class="mt-4 space-y-4">
      <Card v-for="item in tienda.categorias" :key="item.categoria.id">
        <CardHeader class="flex flex-row items-center justify-between">
          <div class="flex items-center gap-2">
            <Checkbox
              :model-value="seleccionadas.has(item.categoria.id)"
              :aria-label="`Seleccionar la categoría ${item.categoria.nombre}`"
              @update:model-value="(valor) => alternarSeleccion(item.categoria.id, valor === true)"
            />
            <CardTitle>{{ item.categoria.nombre }}</CardTitle>
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
                  @confirmar="(cascada) => eliminarSubcategoria(item.categoria.id, sub.id, cascada)"
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
