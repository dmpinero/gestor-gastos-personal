<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useTiendaCategorias } from '@/stores/categorias'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Input } from '@/componentes/ui/input'
import DialogoConfirmarEliminacion from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'

const tienda = useTiendaCategorias()
const error = ref<string | null>(null)
const nombreNuevaCategoria = ref('')
const subcategoriaNuevaPorCategoria = ref<Record<number, string>>({})

onMounted(() => {
  tienda.cargar()
})

async function crearCategoria(): Promise<void> {
  error.value = null
  try {
    await tienda.crearCategoria(nombreNuevaCategoria.value)
    nombreNuevaCategoria.value = ''
  } catch (motivo) {
    error.value = (motivo as Error).message
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
    <h2 class="text-xl font-semibold">Categorías</h2>

    <form class="mt-4 flex gap-2" @submit.prevent="crearCategoria">
      <Input
        v-model="nombreNuevaCategoria"
        placeholder="Nueva categoría"
        required
        class="max-w-xs"
      />
      <Button type="submit">Crear categoría</Button>
    </form>

    <p v-if="error" class="mt-2 text-sm text-destructive" role="alert">{{ error }}</p>

    <div class="mt-6 space-y-4">
      <Card v-for="item in tienda.categorias" :key="item.categoria.id">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>{{ item.categoria.nombre }}</CardTitle>
          <DialogoConfirmarEliminacion
            :descripcion="`la categoría ${item.categoria.nombre}`"
            texto-boton="Eliminar categoría"
            @confirmar="eliminarCategoria(item.categoria.id)"
          />
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
