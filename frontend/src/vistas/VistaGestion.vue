<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs'

const ruta = useRoute()
const router = useRouter()

const pestanas = [
  { nombre: 'gestion-cuentas', ruta: '/gestion/cuentas', etiqueta: 'Cuentas' },
  { nombre: 'gestion-categorias', ruta: '/gestion/categorias', etiqueta: 'Categorías' },
  { nombre: 'gestion-movimientos', ruta: '/gestion/movimientos', etiqueta: 'Movimientos' },
  { nombre: 'gestion-importar', ruta: '/gestion/importar', etiqueta: 'Importar' },
]

const PESTANA_POR_DEFECTO = 'gestion-cuentas'

const pestanaActiva = computed<string>({
  get: () => (typeof ruta.name === 'string' ? ruta.name : PESTANA_POR_DEFECTO),
  set: (nombre) => {
    const destino = pestanas.find((p) => p.nombre === nombre)
    if (destino) router.push(destino.ruta)
  },
})
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold">Gestión</h2>

    <Tabs v-model="pestanaActiva" class="mt-4">
      <TabsList>
        <TabsTrigger v-for="pestana in pestanas" :key="pestana.nombre" :value="pestana.nombre">
          {{ pestana.etiqueta }}
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div class="mt-4">
      <RouterView />
    </div>
  </section>
</template>
