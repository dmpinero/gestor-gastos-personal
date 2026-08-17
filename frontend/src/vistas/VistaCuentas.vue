<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import type { CuentaBancaria, DatosCuenta } from '@/api/tipos'
import { aTextoOULlo } from '@/api/utilidades'
import { useTiendaCuentas } from '@/stores/cuentas'

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

    <form
      class="mt-4 grid grid-cols-2 gap-3 rounded border border-gray-200 p-4"
      @submit.prevent="guardar"
    >
      <input
        v-model="formulario.numero_cuenta"
        placeholder="Número de cuenta"
        required
        :disabled="idEnEdicion !== null"
        class="col-span-2 rounded border border-gray-300 px-2 py-1"
      />
      <input
        v-model="formulario.alias"
        placeholder="Alias"
        class="rounded border border-gray-300 px-2 py-1"
      />
      <input
        v-model="formulario.entidad_bancaria"
        placeholder="Entidad bancaria"
        class="rounded border border-gray-300 px-2 py-1"
      />
      <input
        v-model="formulario.moneda"
        placeholder="Moneda"
        class="rounded border border-gray-300 px-2 py-1"
      />
      <input
        v-model="formulario.titular"
        placeholder="Titular"
        class="rounded border border-gray-300 px-2 py-1"
      />

      <div class="col-span-2 flex gap-2">
        <button type="submit" class="rounded bg-blue-600 px-3 py-1 text-white">
          {{ idEnEdicion === null ? 'Crear cuenta' : 'Guardar cambios' }}
        </button>
        <button
          v-if="idEnEdicion !== null"
          type="button"
          class="rounded border border-gray-300 px-3 py-1"
          @click="limpiarFormulario"
        >
          Cancelar
        </button>
      </div>
    </form>

    <p v-if="errorFormulario" class="mt-2 text-sm text-red-600" role="alert">
      {{ errorFormulario }}
    </p>
    <p v-if="tienda.error" class="mt-2 text-sm text-red-600" role="alert">{{ tienda.error }}</p>

    <table class="mt-6 w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="py-2">Número de cuenta</th>
          <th>Alias</th>
          <th>Entidad</th>
          <th>Moneda</th>
          <th>Titular</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cuenta in tienda.cuentas" :key="cuenta.id" class="border-b border-gray-100">
          <td class="py-2">{{ cuenta.numero_cuenta }}</td>
          <td>{{ cuenta.alias }}</td>
          <td>{{ cuenta.entidad_bancaria }}</td>
          <td>{{ cuenta.moneda }}</td>
          <td>{{ cuenta.titular }}</td>
          <td class="space-x-2 text-right">
            <button class="text-blue-600" @click="editar(cuenta)">Editar</button>
            <button class="text-red-600" @click="eliminar(cuenta.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
