<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'
import { computed, onMounted, reactive, ref } from 'vue'

import type { CuentaBancaria, DatosCuenta } from '@/api/tipos'
import { aTextoOULlo } from '@/api/utilidades'
import { useTiendaCuentas } from '@/stores/cuentas'
import { Button } from '@/componentes/ui/button'
import { Checkbox } from '@/componentes/ui/checkbox'
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
import DialogoConfirmarEliminacion from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'

const tienda = useTiendaCuentas()
const errorFormulario = ref<string | null>(null)
const idEnEdicion = ref<number | null>(null)
const panelAbierto = ref(false)
const seleccionadas = ref<Set<number>>(new Set())

const formulario = reactive<DatosCuenta>({
  numero_cuenta: '',
  alias: '',
  entidad_bancaria: '',
  moneda: '',
  titular: '',
})

const todasSeleccionadas = computed(
  () => tienda.cuentas.length > 0 && seleccionadas.value.size === tienda.cuentas.length,
)

onMounted(() => {
  tienda.cargar()
})

function limpiarFormulario(): void {
  formulario.numero_cuenta = ''
  formulario.alias = ''
  formulario.entidad_bancaria = ''
  formulario.moneda = ''
  formulario.titular = ''
  idEnEdicion.value = null
}

function abrirParaCrear(): void {
  limpiarFormulario()
  panelAbierto.value = true
}

function abrirParaEditar(cuenta: CuentaBancaria): void {
  idEnEdicion.value = cuenta.id
  formulario.numero_cuenta = cuenta.numero_cuenta
  formulario.alias = cuenta.alias ?? ''
  formulario.entidad_bancaria = cuenta.entidad_bancaria ?? ''
  formulario.moneda = cuenta.moneda ?? ''
  formulario.titular = cuenta.titular ?? ''
  panelAbierto.value = true
}

async function guardar(): Promise<void> {
  errorFormulario.value = null
  const datos: DatosCuenta = {
    numero_cuenta: formulario.numero_cuenta,
    alias: aTextoOULlo(formulario.alias ?? ''),
    entidad_bancaria: aTextoOULlo(formulario.entidad_bancaria ?? ''),
    moneda: aTextoOULlo(formulario.moneda ?? ''),
    titular: aTextoOULlo(formulario.titular ?? ''),
  }
  try {
    if (idEnEdicion.value === null) {
      await tienda.crear(datos)
    } else {
      await tienda.actualizar(idEnEdicion.value, datos)
    }
    panelAbierto.value = false
    limpiarFormulario()
  } catch (motivo) {
    errorFormulario.value = (motivo as Error).message
  }
}

async function eliminar(id: number): Promise<void> {
  errorFormulario.value = null
  try {
    await tienda.eliminar(id)
    seleccionadas.value.delete(id)
  } catch (motivo) {
    errorFormulario.value = (motivo as Error).message
  }
}

async function eliminarSeleccionadas(): Promise<void> {
  errorFormulario.value = null
  try {
    await Promise.all([...seleccionadas.value].map((id) => tienda.eliminar(id)))
    seleccionadas.value.clear()
  } catch (motivo) {
    errorFormulario.value = (motivo as Error).message
  }
}

function alternarSeleccionTodas(marcado: boolean): void {
  seleccionadas.value = marcado ? new Set(tienda.cuentas.map((c) => c.id)) : new Set()
}

function alternarSeleccion(id: number, marcado: boolean): void {
  const nuevaSeleccion = new Set(seleccionadas.value)
  if (marcado) nuevaSeleccion.add(id)
  else nuevaSeleccion.delete(id)
  seleccionadas.value = nuevaSeleccion
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Cuentas bancarias</h2>
      <Button @click="abrirParaCrear">Crear cuenta</Button>
    </div>

    <Sheet v-model:open="panelAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{{ idEnEdicion === null ? 'Crear cuenta' : 'Editar cuenta' }}</SheetTitle>
        </SheetHeader>

        <form class="flex flex-col gap-3 px-4" @submit.prevent="guardar">
          <div class="flex flex-col gap-1.5">
            <Label for="numero-cuenta">Número de cuenta</Label>
            <Input
              id="numero-cuenta"
              v-model="formulario.numero_cuenta"
              placeholder="Número de cuenta"
              required
              :disabled="idEnEdicion !== null"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="alias">Alias</Label>
            <Input id="alias" v-model="formulario.alias" placeholder="Alias" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="entidad-bancaria">Entidad bancaria</Label>
            <Input
              id="entidad-bancaria"
              v-model="formulario.entidad_bancaria"
              placeholder="Entidad bancaria"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="moneda">Moneda</Label>
            <Input id="moneda" v-model="formulario.moneda" placeholder="Moneda" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="titular">Titular</Label>
            <Input id="titular" v-model="formulario.titular" placeholder="Titular" />
          </div>

          <p v-if="errorFormulario" class="text-sm text-destructive" role="alert">
            {{ errorFormulario }}
          </p>

          <div class="flex gap-2">
            <Button type="submit">
              {{ idEnEdicion === null ? 'Crear cuenta' : 'Guardar cambios' }}
            </Button>
            <Button type="button" variant="outline" @click="panelAbierto = false">Cancelar</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <p v-if="tienda.error" class="mt-2 text-sm text-destructive" role="alert">{{ tienda.error }}</p>

    <div
      v-if="seleccionadas.size > 0"
      class="mt-4 flex items-center gap-3 rounded-lg border p-2 text-sm"
    >
      <span>{{ seleccionadas.size }} seleccionados</span>
      <DialogoConfirmarEliminacion
        :descripcion="`${seleccionadas.size} cuentas seleccionadas`"
        texto-boton="Eliminar seleccionados"
        @confirmar="eliminarSeleccionadas"
      />
    </div>

    <Table class="mt-6">
      <TableHeader>
        <TableRow>
          <TableHead class="w-8">
            <Checkbox
              :model-value="todasSeleccionadas"
              aria-label="Seleccionar todas las cuentas"
              @update:model-value="(valor) => alternarSeleccionTodas(valor === true)"
            />
          </TableHead>
          <TableHead>Número de cuenta</TableHead>
          <TableHead>Alias</TableHead>
          <TableHead>Entidad</TableHead>
          <TableHead>Moneda</TableHead>
          <TableHead>Titular</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="cuenta in tienda.cuentas" :key="cuenta.id">
          <TableCell>
            <Checkbox
              :model-value="seleccionadas.has(cuenta.id)"
              :aria-label="`Seleccionar la cuenta ${cuenta.numero_cuenta}`"
              @update:model-value="(valor) => alternarSeleccion(cuenta.id, valor === true)"
            />
          </TableCell>
          <TableCell>{{ cuenta.numero_cuenta }}</TableCell>
          <TableCell>{{ cuenta.alias }}</TableCell>
          <TableCell>{{ cuenta.entidad_bancaria }}</TableCell>
          <TableCell>{{ cuenta.moneda }}</TableCell>
          <TableCell>{{ cuenta.titular }}</TableCell>
          <TableCell class="text-right">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar"
              @click="abrirParaEditar(cuenta)"
            >
              <Pencil class="size-4" />
            </Button>
            <DialogoConfirmarEliminacion
              :descripcion="`la cuenta ${cuenta.numero_cuenta}`"
              @confirmar="eliminar(cuenta.id)"
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
