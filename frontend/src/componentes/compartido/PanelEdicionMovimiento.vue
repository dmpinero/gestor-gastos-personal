<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import type { DatosMovimiento, Movimiento } from '@/api/tipos'
import { aTextoOULlo } from '@/api/utilidades'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import { useTiendaMovimientos } from '@/stores/movimientos'
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

const emit = defineEmits<{ guardado: [movimiento: Movimiento] }>()

const tiendaCuentas = useTiendaCuentas()
const tiendaCategorias = useTiendaCategorias()
const tiendaMovimientos = useTiendaMovimientos()

const error = ref<string | null>(null)
const idEnEdicion = ref<number | null>(null)
const panelAbierto = ref(false)

const formulario = reactive<DatosMovimiento>({
  cuenta_id: 0,
  categoria_id: 0,
  subcategoria_id: null,
  fecha_valor: '',
  descripcion: '',
  comentario: '',
  importe: '',
  saldo: '',
})

// Los componentes Select trabajan con valores de texto; estos proxies traducen
// entre esa representación y los identificadores numéricos del formulario.
const cuentaFormularioTexto = computed<string | undefined>({
  get: () => (formulario.cuenta_id ? String(formulario.cuenta_id) : undefined),
  set: (valor) => {
    formulario.cuenta_id = valor === undefined ? 0 : Number(valor)
  },
})

const categoriaSeleccionadaTexto = computed<string | undefined>({
  get: () => (formulario.categoria_id ? String(formulario.categoria_id) : undefined),
  set: (valor) => {
    formulario.categoria_id = valor === undefined ? 0 : Number(valor)
    formulario.subcategoria_id = null
  },
})

const SIN_SUBCATEGORIA = 'sin-subcategoria'

const subcategoriaSeleccionadaTexto = computed<string>({
  get: () =>
    formulario.subcategoria_id === null ? SIN_SUBCATEGORIA : String(formulario.subcategoria_id),
  set: (valor) => {
    formulario.subcategoria_id = valor === SIN_SUBCATEGORIA ? null : Number(valor)
  },
})

const subcategoriasDeLaCategoria = computed(() => {
  const categoria = tiendaCategorias.categorias.find(
    (c) => c.categoria.id === formulario.categoria_id,
  )
  return categoria?.subcategorias ?? []
})

onMounted(() => {
  tiendaCuentas.cargar()
  tiendaCategorias.cargar()
})

function limpiarFormulario(): void {
  formulario.cuenta_id = 0
  formulario.categoria_id = 0
  formulario.subcategoria_id = null
  formulario.fecha_valor = ''
  formulario.descripcion = ''
  formulario.comentario = ''
  formulario.importe = ''
  formulario.saldo = ''
  idEnEdicion.value = null
}

function abrirParaCrear(cuentaIdPorDefecto?: number): void {
  error.value = null
  limpiarFormulario()
  formulario.cuenta_id = cuentaIdPorDefecto ?? 0
  panelAbierto.value = true
}

function abrirParaEditar(movimiento: Movimiento): void {
  error.value = null
  idEnEdicion.value = movimiento.id
  formulario.cuenta_id = movimiento.cuenta_id
  formulario.categoria_id = movimiento.categoria_id
  formulario.subcategoria_id = movimiento.subcategoria_id
  formulario.fecha_valor = movimiento.fecha_valor
  formulario.descripcion = movimiento.descripcion
  formulario.comentario = movimiento.comentario ?? ''
  formulario.importe = movimiento.importe
  formulario.saldo = movimiento.saldo
  panelAbierto.value = true
}

async function guardar(): Promise<void> {
  error.value = null
  const datos: DatosMovimiento = {
    ...formulario,
    comentario: aTextoOULlo(formulario.comentario ?? ''),
  }
  try {
    const movimiento =
      idEnEdicion.value === null
        ? await tiendaMovimientos.crear(datos)
        : await tiendaMovimientos.actualizar(idEnEdicion.value, datos)
    panelAbierto.value = false
    limpiarFormulario()
    emit('guardado', movimiento)
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

defineExpose({ abrirParaCrear, abrirParaEditar })
</script>

<template>
  <Sheet v-model:open="panelAbierto">
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{{
          idEnEdicion === null ? 'Crear movimiento' : 'Editar movimiento'
        }}</SheetTitle>
      </SheetHeader>

      <form class="flex flex-col gap-3 px-4" @submit.prevent="guardar">
        <div class="flex flex-col gap-1.5">
          <Label id="etiqueta-cuenta-formulario" for="selector-cuenta-formulario">Cuenta</Label>
          <Select v-model="cuentaFormularioTexto">
            <SelectTrigger
              id="selector-cuenta-formulario"
              aria-labelledby="etiqueta-cuenta-formulario"
            >
              <SelectValue placeholder="Selecciona una cuenta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="cuenta in tiendaCuentas.cuentas"
                :key="cuenta.id"
                :value="String(cuenta.id)"
              >
                {{ cuenta.alias ?? cuenta.numero_cuenta }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="fecha-valor">Fecha</Label>
          <Input id="fecha-valor" v-model="formulario.fecha_valor" type="date" required />
        </div>

        <div class="flex flex-col gap-1.5">
          <Label id="etiqueta-categoria" for="selector-categoria">Categoría</Label>
          <Select v-model="categoriaSeleccionadaTexto">
            <SelectTrigger id="selector-categoria" aria-labelledby="etiqueta-categoria">
              <SelectValue placeholder="Categoría" />
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
          <Label id="etiqueta-subcategoria" for="selector-subcategoria">Subcategoría</Label>
          <Select v-model="subcategoriaSeleccionadaTexto">
            <SelectTrigger id="selector-subcategoria" aria-labelledby="etiqueta-subcategoria">
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

        <div class="flex flex-col gap-1.5">
          <Label for="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            v-model="formulario.descripcion"
            placeholder="Descripción"
            required
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="comentario">Comentario</Label>
          <Input id="comentario" v-model="formulario.comentario" placeholder="Comentario" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="importe">Importe</Label>
          <Input id="importe" v-model="formulario.importe" placeholder="Importe" required />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="saldo">Saldo</Label>
          <Input id="saldo" v-model="formulario.saldo" placeholder="Saldo" required />
        </div>

        <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>

        <div class="flex gap-2">
          <Button type="submit" variant="success">
            {{ idEnEdicion === null ? 'Crear movimiento' : 'Guardar cambios' }}
          </Button>
          <Button type="button" variant="destructive" @click="panelAbierto = false"
            >Cancelar</Button
          >
        </div>
      </form>
    </SheetContent>
  </Sheet>
</template>
