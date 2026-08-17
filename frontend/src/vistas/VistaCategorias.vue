<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useTiendaCategorias } from '@/stores/categorias'

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
      <input
        v-model="nombreNuevaCategoria"
        placeholder="Nueva categoría"
        required
        class="rounded border border-gray-300 px-2 py-1"
      />
      <button type="submit" class="rounded bg-blue-600 px-3 py-1 text-white">
        Crear categoría
      </button>
    </form>

    <p v-if="error" class="mt-2 text-sm text-red-600" role="alert">{{ error }}</p>

    <ul class="mt-6 space-y-4">
      <li
        v-for="item in tienda.categorias"
        :key="item.categoria.id"
        class="rounded border border-gray-200 p-3"
      >
        <div class="flex items-center justify-between">
          <h3 class="font-medium">{{ item.categoria.nombre }}</h3>
          <button class="text-red-600" @click="eliminarCategoria(item.categoria.id)">
            Eliminar categoría
          </button>
        </div>

        <ul class="mt-2 ml-4 space-y-1 text-sm">
          <li
            v-for="sub in item.subcategorias"
            :key="sub.id"
            class="flex items-center justify-between"
          >
            <span>{{ sub.nombre }}</span>
            <button class="text-red-600" @click="eliminarSubcategoria(item.categoria.id, sub.id)">
              Eliminar
            </button>
          </li>
        </ul>

        <form class="mt-2 ml-4 flex gap-2" @submit.prevent="crearSubcategoria(item.categoria.id)">
          <input
            v-model="subcategoriaNuevaPorCategoria[item.categoria.id]"
            placeholder="Nueva subcategoría"
            class="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button type="submit" class="rounded border border-gray-300 px-2 py-1 text-sm">
            Añadir
          </button>
        </form>
      </li>
    </ul>
  </section>
</template>
