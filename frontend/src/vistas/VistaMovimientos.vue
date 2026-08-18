<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import type { DatosMovimiento, Movimiento } from '@/api/tipos'
import { aTextoOULlo } from '@/api/utilidades'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import { useTiendaMovimientos } from '@/stores/movimientos'
import { Button } from '@/componentes/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'
import DialogoConfirmarEliminacion from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'

const ruta = useRoute()
const tiendaCuentas = useTiendaCuentas()
const tiendaCategorias = useTiendaCategorias()
const tiendaMovimientos = useTiendaMovimientos()

const cuentaSeleccionada = ref<number | null>(null)
const error = ref<string | null>(null)
const idEnEdicion = ref<number | null>(null)
const panelAbierto = ref(false)
const seleccionados = ref<Set<number>>(new Set())

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
const cuentaSeleccionadaTexto = computed<string | undefined>({
  get: () => (cuentaSeleccionada.value === null ? undefined : String(cuentaSeleccionada.value)),
  set: (valor) => {
    cuentaSeleccionada.value = valor === undefined ? null : Number(valor)
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

const todosSeleccionados = computed(
  () =>
    tiendaMovimientos.movimientos.length > 0 &&
    seleccionados.value.size === tiendaMovimientos.movimientos.length,
)

onMounted(async () => {
  await Promise.all([tiendaCuentas.cargar(), tiendaCategorias.cargar()])

  // Si se llega desde "Ver movimientos" tras una importación, se preselecciona
  // la cuenta indicada en la URL en vez de la primera de la lista.
  const idDesdeUrl = Number(ruta.query.cuenta_id)
  const cuentaDesdeUrl = tiendaCuentas.cuentas.find((c) => c.id === idDesdeUrl)
  if (cuentaDesdeUrl) {
    cuentaSeleccionada.value = cuentaDesdeUrl.id
  } else if (tiendaCuentas.cuentas[0]) {
    cuentaSeleccionada.value = tiendaCuentas.cuentas[0].id
  }
})

watch(cuentaSeleccionada, (id) => {
  seleccionados.value = new Set()
  if (id !== null) {
    formulario.cuenta_id = id
    tiendaMovimientos.cargar(id)
  }
})

function limpiarFormulario(): void {
  formulario.categoria_id = 0
  formulario.subcategoria_id = null
  formulario.fecha_valor = ''
  formulario.descripcion = ''
  formulario.comentario = ''
  formulario.importe = ''
  formulario.saldo = ''
  idEnEdicion.value = null
}

function abrirParaCrear(): void {
  limpiarFormulario()
  panelAbierto.value = true
}

function abrirParaEditar(movimiento: Movimiento): void {
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
    if (idEnEdicion.value === null) {
      await tiendaMovimientos.crear(datos)
    } else {
      await tiendaMovimientos.actualizar(idEnEdicion.value, datos)
    }
    panelAbierto.value = false
    limpiarFormulario()
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

async function eliminar(id: number): Promise<void> {
  error.value = null
  try {
    await tiendaMovimientos.eliminar(id)
    seleccionados.value.delete(id)
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

async function eliminarSeleccionados(): Promise<void> {
  error.value = null
  try {
    await Promise.all([...seleccionados.value].map((id) => tiendaMovimientos.eliminar(id)))
    seleccionados.value.clear()
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

function alternarSeleccionTodos(marcado: boolean): void {
  seleccionados.value = marcado
    ? new Set(tiendaMovimientos.movimientos.map((m) => m.id))
    : new Set()
}

function alternarSeleccion(id: number, marcado: boolean): void {
  const nuevaSeleccion = new Set(seleccionados.value)
  if (marcado) nuevaSeleccion.add(id)
  else nuevaSeleccion.delete(id)
  seleccionados.value = nuevaSeleccion
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Movimientos</h2>
      <Button @click="abrirParaCrear">Crear movimiento</Button>
    </div>

    <div class="mt-4 flex max-w-xs flex-col gap-1.5">
      <Label id="etiqueta-cuenta" for="selector-cuenta">Cuenta</Label>
      <Select v-model="cuentaSeleccionadaTexto">
        <SelectTrigger id="selector-cuenta" aria-labelledby="etiqueta-cuenta">
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

    <Sheet v-model:open="panelAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{{
            idEnEdicion === null ? 'Crear movimiento' : 'Editar movimiento'
          }}</SheetTitle>
        </SheetHeader>

        <form class="flex flex-col gap-3 px-4" @submit.prevent="guardar">
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
                <SelectItem
                  v-for="s in subcategoriasDeLaCategoria"
                  :key="s.id"
                  :value="String(s.id)"
                >
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
            <Button type="submit">
              {{ idEnEdicion === null ? 'Crear movimiento' : 'Guardar cambios' }}
            </Button>
            <Button type="button" variant="outline" @click="panelAbierto = false">Cancelar</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <div
      v-if="seleccionados.size > 0"
      class="mt-4 flex items-center gap-3 rounded-lg border p-2 text-sm"
    >
      <span>{{ seleccionados.size }} seleccionados</span>
      <DialogoConfirmarEliminacion
        :descripcion="`${seleccionados.size} movimientos seleccionados`"
        texto-boton="Eliminar seleccionados"
        @confirmar="eliminarSeleccionados"
      />
    </div>

    <Table class="mt-6">
      <TableHeader>
        <TableRow>
          <TableHead class="w-8">
            <Checkbox
              :model-value="todosSeleccionados"
              aria-label="Seleccionar todos los movimientos"
              @update:model-value="(valor) => alternarSeleccionTodos(valor === true)"
            />
          </TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Importe</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="movimiento in tiendaMovimientos.movimientos" :key="movimiento.id">
          <TableCell>
            <Checkbox
              :model-value="seleccionados.has(movimiento.id)"
              :aria-label="`Seleccionar el movimiento ${movimiento.descripcion}`"
              @update:model-value="(valor) => alternarSeleccion(movimiento.id, valor === true)"
            />
          </TableCell>
          <TableCell>{{ movimiento.fecha_valor }}</TableCell>
          <TableCell>{{ movimiento.descripcion }}</TableCell>
          <TableCell>{{ movimiento.importe }}</TableCell>
          <TableCell>{{ movimiento.saldo }}</TableCell>
          <TableCell class="text-right">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar"
              @click="abrirParaEditar(movimiento)"
            >
              <Pencil class="size-4" />
            </Button>
            <DialogoConfirmarEliminacion
              :descripcion="`el movimiento ${movimiento.descripcion}`"
              @confirmar="eliminar(movimiento.id)"
            >
              <template #disparador>
                <Button variant="ghost" size="icon" class="text-destructive" aria-label="Eliminar">
                  <Trash2 class="size-4" />
                </Button>
              </template>
            </DialogoConfirmarEliminacion>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </section>
</template>
