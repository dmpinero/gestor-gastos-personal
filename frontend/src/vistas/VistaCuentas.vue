<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import type { CuentaBancaria, DatosCuenta } from '@/api/tipos'
import { aTextoOULlo } from '@/api/utilidades'
import { useTiendaCuentas } from '@/stores/cuentas'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
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

const formulario = reactive<DatosCuenta>({
  numero_cuenta: '',
  alias: '',
  entidad_bancaria: '',
  moneda: '',
  titular: '',
})

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

function editar(cuenta: CuentaBancaria): void {
  idEnEdicion.value = cuenta.id
  formulario.numero_cuenta = cuenta.numero_cuenta
  formulario.alias = cuenta.alias ?? ''
  formulario.entidad_bancaria = cuenta.entidad_bancaria ?? ''
  formulario.moneda = cuenta.moneda ?? ''
  formulario.titular = cuenta.titular ?? ''
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
    limpiarFormulario()
  } catch (motivo) {
    errorFormulario.value = (motivo as Error).message
  }
}

async function eliminar(id: number): Promise<void> {
  errorFormulario.value = null
  try {
    await tienda.eliminar(id)
  } catch (motivo) {
    errorFormulario.value = (motivo as Error).message
  }
}
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold">Cuentas bancarias</h2>

    <form class="mt-4 grid grid-cols-2 gap-3 rounded-lg border p-4" @submit.prevent="guardar">
      <div class="col-span-2 flex flex-col gap-1.5">
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

      <div class="col-span-2 flex gap-2">
        <Button type="submit">
          {{ idEnEdicion === null ? 'Crear cuenta' : 'Guardar cambios' }}
        </Button>
        <Button
          v-if="idEnEdicion !== null"
          type="button"
          variant="outline"
          @click="limpiarFormulario"
        >
          Cancelar
        </Button>
      </div>
    </form>

    <p v-if="errorFormulario" class="mt-2 text-sm text-destructive" role="alert">
      {{ errorFormulario }}
    </p>
    <p v-if="tienda.error" class="mt-2 text-sm text-destructive" role="alert">{{ tienda.error }}</p>

    <Table class="mt-6">
      <TableHeader>
        <TableRow>
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
          <TableCell>{{ cuenta.numero_cuenta }}</TableCell>
          <TableCell>{{ cuenta.alias }}</TableCell>
          <TableCell>{{ cuenta.entidad_bancaria }}</TableCell>
          <TableCell>{{ cuenta.moneda }}</TableCell>
          <TableCell>{{ cuenta.titular }}</TableCell>
          <TableCell class="text-right">
            <Button variant="link" @click="editar(cuenta)">Editar</Button>
            <DialogoConfirmarEliminacion
              :descripcion="`la cuenta ${cuenta.numero_cuenta}`"
              @confirmar="eliminar(cuenta.id)"
            />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </section>
</template>
