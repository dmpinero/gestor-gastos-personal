<script setup lang="ts">
import { computed, ref } from 'vue'

import { useTiendaCategorias } from '@/stores/categorias'
import { Button } from '@/componentes/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/componentes/ui/dialog'
import { Label } from '@/componentes/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/ui/select'

const props = defineProps<{ cantidad: number }>()
const emit = defineEmits<{ confirmar: [categoriaId: number, subcategoriaId: number | null] }>()

const tiendaCategorias = useTiendaCategorias()

const abierto = ref(false)
const categoriaId = ref(0)
const subcategoriaId = ref<number | null>(null)

const SIN_SUBCATEGORIA = 'sin-subcategoria'

// Mismos proxies texto↔número que PanelEdicionMovimiento.vue: elegir una
// categoría nueva descarta la subcategoría previa, porque puede no
// pertenecer a la categoría recién elegida.
const categoriaTexto = computed<string | undefined>({
  get: () => (categoriaId.value ? String(categoriaId.value) : undefined),
  set: (valor) => {
    categoriaId.value = valor === undefined ? 0 : Number(valor)
    subcategoriaId.value = null
  },
})

const subcategoriaTexto = computed<string>({
  get: () => (subcategoriaId.value === null ? SIN_SUBCATEGORIA : String(subcategoriaId.value)),
  set: (valor) => {
    subcategoriaId.value = valor === SIN_SUBCATEGORIA ? null : Number(valor)
  },
})

const subcategoriasDeLaCategoria = computed(() => {
  const categoria = tiendaCategorias.categorias.find((c) => c.categoria.id === categoriaId.value)
  return categoria?.subcategorias ?? []
})

function confirmar(): void {
  emit('confirmar', categoriaId.value, subcategoriaId.value)
  abierto.value = false
  categoriaId.value = 0
  subcategoriaId.value = null
}

// La interacción real con los Select (Reka UI) es frágil en jsdom; se
// exponen los proxies para que los tests fijen la elección directamente,
// dejando la interacción real con el desplegable cubierta por el E2E.
defineExpose({ categoriaTexto, subcategoriaTexto })
</script>

<template>
  <Dialog v-model:open="abierto">
    <DialogTrigger as-child>
      <Button type="button" variant="outline">Cambiar categoría</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Cambiar categoría de {{ props.cantidad }} movimiento{{
            props.cantidad === 1 ? '' : 's'
          }}
          seleccionado{{ props.cantidad === 1 ? '' : 's' }}
        </DialogTitle>
      </DialogHeader>

      <div class="flex flex-col gap-1.5">
        <Label id="etiqueta-categoria-masiva" for="selector-categoria-masiva">Categoría</Label>
        <Select v-model="categoriaTexto">
          <SelectTrigger
            id="selector-categoria-masiva"
            aria-labelledby="etiqueta-categoria-masiva"
            class="w-full"
          >
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="c in tiendaCategorias.categorias"
              :key="c.categoria.id"
              :value="String(c.categoria.id)"
            >
              {{ c.categoria.nombre }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label id="etiqueta-subcategoria-masiva" for="selector-subcategoria-masiva"
          >Subcategoría</Label
        >
        <Select v-model="subcategoriaTexto" :disabled="categoriaId === 0">
          <SelectTrigger
            id="selector-subcategoria-masiva"
            aria-labelledby="etiqueta-subcategoria-masiva"
            class="w-full"
          >
            <SelectValue placeholder="(sin subcategoría)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</SelectItem>
            <SelectItem v-for="s in subcategoriasDeLaCategoria" :key="s.id" :value="String(s.id)">
              {{ s.nombre }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="success" :disabled="categoriaId === 0" @click="confirmar"
          >Aplicar</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
