<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { computed, ref } from 'vue'

import { useTiendaCategorias } from '@/stores/categorias'
import { Button } from '@/componentes/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from '@/componentes/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/componentes/ui/dialog'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/componentes/ui/sheet'

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

function mostrarCategoria(valor: string): string {
  return (
    tiendaCategorias.categorias.find((c) => c.categoria.id === Number(valor))?.categoria.nombre ??
    ''
  )
}

function mostrarSubcategoria(valor: string): string {
  if (valor === SIN_SUBCATEGORIA) return '(sin subcategoría)'
  for (const c of tiendaCategorias.categorias) {
    const sub = c.subcategorias.find((s) => s.id === Number(valor))
    if (sub) return sub.nombre
  }
  return ''
}

function confirmar(): void {
  emit('confirmar', categoriaId.value, subcategoriaId.value)
  abierto.value = false
  categoriaId.value = 0
  subcategoriaId.value = null
}

// Mismo patrón que PanelEdicionMovimiento.vue: crear categoría/subcategoría
// sin salir del diálogo de recategorización en bloque.
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
    categoriaTexto.value = String(categoria.id)
    panelCrearCategoriaAbierto.value = false
  } catch (motivo) {
    errorCrearCategoria.value = (motivo as Error).message
  }
}

const nombreCategoriaActual = computed(() => mostrarCategoria(String(categoriaId.value)))

const panelCrearSubcategoriaAbierto = ref(false)
const nombreNuevaSubcategoria = ref('')
const errorCrearSubcategoria = ref<string | null>(null)

function abrirCrearSubcategoria(): void {
  nombreNuevaSubcategoria.value = ''
  errorCrearSubcategoria.value = null
  panelCrearSubcategoriaAbierto.value = true
}

async function crearSubcategoriaNueva(): Promise<void> {
  errorCrearSubcategoria.value = null
  try {
    const subcategoria = await tiendaCategorias.crearSubcategoria(
      categoriaId.value,
      nombreNuevaSubcategoria.value,
    )
    subcategoriaTexto.value = String(subcategoria.id)
    panelCrearSubcategoriaAbierto.value = false
  } catch (motivo) {
    errorCrearSubcategoria.value = (motivo as Error).message
  }
}

// La interacción real con los Combobox (Reka UI) es frágil en jsdom; se
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
        <div class="flex gap-2">
          <Combobox v-model="categoriaTexto" open-on-click open-on-focus>
            <ComboboxTrigger class="w-full">
              <ComboboxInput
                id="selector-categoria-masiva"
                aria-labelledby="etiqueta-categoria-masiva"
                placeholder="Selecciona o escribe para buscar"
                :display-value="mostrarCategoria"
              />
            </ComboboxTrigger>
            <ComboboxContent>
              <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
              <ComboboxItem
                v-for="c in tiendaCategorias.categorias"
                :key="c.categoria.id"
                :value="String(c.categoria.id)"
              >
                {{ c.categoria.nombre }}
              </ComboboxItem>
            </ComboboxContent>
          </Combobox>
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
        <Label id="etiqueta-subcategoria-masiva" for="selector-subcategoria-masiva"
          >Subcategoría</Label
        >
        <div class="flex gap-2">
          <Combobox v-model="subcategoriaTexto" open-on-click open-on-focus>
            <ComboboxTrigger class="w-full">
              <ComboboxInput
                id="selector-subcategoria-masiva"
                aria-labelledby="etiqueta-subcategoria-masiva"
                placeholder="Selecciona o escribe para buscar"
                :display-value="mostrarSubcategoria"
              />
            </ComboboxTrigger>
            <ComboboxContent>
              <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
              <ComboboxItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</ComboboxItem>
              <ComboboxItem
                v-for="s in subcategoriasDeLaCategoria"
                :key="s.id"
                :value="String(s.id)"
              >
                {{ s.nombre }}
              </ComboboxItem>
            </ComboboxContent>
          </Combobox>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Crear subcategoría"
            :disabled="categoriaId === 0"
            @click="abrirCrearSubcategoria"
          >
            <Plus class="size-4" />
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="success" :disabled="categoriaId === 0" @click="confirmar"
          >Aplicar</Button
        >
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
          <Label for="nombre-nueva-categoria-masiva">Nombre</Label>
          <Input
            id="nombre-nueva-categoria-masiva"
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

  <Sheet v-model:open="panelCrearSubcategoriaAbierto">
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Nueva subcategoría en "{{ nombreCategoriaActual }}"</SheetTitle>
      </SheetHeader>

      <form class="flex flex-col gap-3 px-4" @submit.prevent="crearSubcategoriaNueva">
        <div class="flex flex-col gap-1.5">
          <Label for="nombre-nueva-subcategoria-masiva">Nombre</Label>
          <Input
            id="nombre-nueva-subcategoria-masiva"
            v-model="nombreNuevaSubcategoria"
            placeholder="Nueva subcategoría"
            required
          />
        </div>

        <p v-if="errorCrearSubcategoria" class="text-sm text-destructive" role="alert">
          {{ errorCrearSubcategoria }}
        </p>

        <div class="flex gap-2">
          <Button type="submit" variant="success">Crear subcategoría</Button>
          <Button type="button" variant="destructive" @click="panelCrearSubcategoriaAbierto = false"
            >Cancelar</Button
          >
        </div>
      </form>
    </SheetContent>
  </Sheet>
</template>
