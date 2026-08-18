<script setup lang="ts">
import { Pencil } from '@lucide/vue'
import { onMounted, ref } from 'vue'

import type { Categoria } from '@/api/tipos'
import { useTiendaCategorias } from '@/stores/categorias'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/componentes/ui/sheet'
import DialogoConfirmarEliminacion from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'

const tienda = useTiendaCategorias()
const error = ref<string | null>(null)
const errorPanel = ref<string | null>(null)
const subcategoriaNuevaPorCategoria = ref<Record<number, string>>({})

const panelAbierto = ref(false)
const idEnEdicion = ref<number | null>(null)
const nombreFormulario = ref('')

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

async function eliminarCategoria(id: number): Promise<void> {
  error.value = null
  try {
    await tienda.eliminarCategoria(id)
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
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

async function eliminarSubcategoria(idCategoria: number, idSubcategoria: number): Promise<void> {
  error.value = null
  try {
    await tienda.eliminarSubcategoria(idCategoria, idSubcategoria)
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Categorías</h2>
      <Button @click="abrirParaCrear">Crear categoría</Button>
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
            <Button type="submit">
              {{ idEnEdicion === null ? 'Crear categoría' : 'Guardar cambios' }}
            </Button>
            <Button type="button" variant="outline" @click="panelAbierto = false">Cancelar</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <p v-if="error" class="mt-2 text-sm text-destructive" role="alert">{{ error }}</p>

    <div class="mt-6 space-y-4">
      <Card v-for="item in tienda.categorias" :key="item.categoria.id">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>{{ item.categoria.nombre }}</CardTitle>
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
              @confirmar="eliminarCategoria(item.categoria.id)"
            />
          </div>
        </CardHeader>

        <CardContent>
          <ul class="space-y-1 text-sm">
            <li
              v-for="sub in item.subcategorias"
              :key="sub.id"
              class="flex items-center justify-between"
            >
              <span>{{ sub.nombre }}</span>
              <DialogoConfirmarEliminacion
                :descripcion="`la subcategoría ${sub.nombre}`"
                @confirmar="eliminarSubcategoria(item.categoria.id, sub.id)"
              />
            </li>
          </ul>

          <form class="mt-2 flex gap-2" @submit.prevent="crearSubcategoria(item.categoria.id)">
            <Input
              v-model="subcategoriaNuevaPorCategoria[item.categoria.id]"
              placeholder="Nueva subcategoría"
              class="max-w-xs"
            />
            <Button type="submit" variant="outline">Añadir</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
