<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import type { DatosMovimiento, Movimiento } from '@/api/tipos'
import { aTextoOULlo } from '@/api/utilidades'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import { useTiendaMovimientos } from '@/stores/movimientos'

const tiendaCuentas = useTiendaCuentas()
const tiendaCategorias = useTiendaCategorias()
const tiendaMovimientos = useTiendaMovimientos()

const cuentaSeleccionada = ref<number | null>(null)
const error = ref<string | null>(null)
const idEnEdicion = ref<number | null>(null)

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

const subcategoriasDeLaCategoria = computed(() => {
  const categoria = tiendaCategorias.categorias.find(
    (c) => c.categoria.id === formulario.categoria_id,
  )
  return categoria?.subcategorias ?? []
})

onMounted(async () => {
  await Promise.all([tiendaCuentas.cargar(), tiendaCategorias.cargar()])
  if (tiendaCuentas.cuentas[0]) {
    cuentaSeleccionada.value = tiendaCuentas.cuentas[0].id
  }
})

watch(cuentaSeleccionada, (id) => {
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

function editar(movimiento: Movimiento): void {
  idEnEdicion.value = movimiento.id
  formulario.cuenta_id = movimiento.cuenta_id
  formulario.categoria_id = movimiento.categoria_id
  formulario.subcategoria_id = movimiento.subcategoria_id
  formulario.fecha_valor = movimiento.fecha_valor
  formulario.descripcion = movimiento.descripcion
  formulario.comentario = movimiento.comentario ?? ''
  formulario.importe = movimiento.importe
  formulario.saldo = movimiento.saldo
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
    limpiarFormulario()
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

async function eliminar(id: number): Promise<void> {
  error.value = null
  try {
    await tiendaMovimientos.eliminar(id)
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold">Movimientos</h2>

    <label class="mt-4 block text-sm">
      Cuenta
      <select v-model="cuentaSeleccionada" class="ml-2 rounded border border-gray-300 px-2 py-1">
        <option v-for="cuenta in tiendaCuentas.cuentas" :key="cuenta.id" :value="cuenta.id">
          {{ cuenta.alias ?? cuenta.numero_cuenta }}
        </option>
      </select>
    </label>

    <form
      class="mt-4 grid grid-cols-3 gap-3 rounded border border-gray-200 p-4"
      @submit.prevent="guardar"
    >
      <input
        v-model="formulario.fecha_valor"
        type="date"
        required
        class="rounded border border-gray-300 px-2 py-1"
      />
      <select
        v-model.number="formulario.categoria_id"
        required
        class="rounded border border-gray-300 px-2 py-1"
      >
        <option :value="0" disabled>Categoría</option>
        <option
          v-for="c in tiendaCategorias.categorias"
          :key="c.categoria.id"
          :value="c.categoria.id"
        >
          {{ c.categoria.nombre }}
        </option>
      </select>
      <select
        v-model.number="formulario.subcategoria_id"
        class="rounded border border-gray-300 px-2 py-1"
      >
        <option :value="null">(sin subcategoría)</option>
        <option v-for="s in subcategoriasDeLaCategoria" :key="s.id" :value="s.id">
          {{ s.nombre }}
        </option>
      </select>
      <input
        v-model="formulario.descripcion"
        placeholder="Descripción"
        required
        class="col-span-2 rounded border border-gray-300 px-2 py-1"
      />
      <input
        v-model="formulario.comentario"
        placeholder="Comentario"
        class="rounded border border-gray-300 px-2 py-1"
      />
      <input
        v-model="formulario.importe"
        placeholder="Importe"
        required
        class="rounded border border-gray-300 px-2 py-1"
      />
      <input
        v-model="formulario.saldo"
        placeholder="Saldo"
        required
        class="rounded border border-gray-300 px-2 py-1"
      />

      <div class="col-span-3 flex gap-2">
        <button type="submit" class="rounded bg-blue-600 px-3 py-1 text-white">
          {{ idEnEdicion === null ? 'Crear movimiento' : 'Guardar cambios' }}
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

    <p v-if="error" class="mt-2 text-sm text-red-600" role="alert">{{ error }}</p>

    <table class="mt-6 w-full text-left text-sm">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="py-2">Fecha</th>
          <th>Descripción</th>
          <th>Importe</th>
          <th>Saldo</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="movimiento in tiendaMovimientos.movimientos"
          :key="movimiento.id"
          class="border-b border-gray-100"
        >
          <td class="py-2">{{ movimiento.fecha_valor }}</td>
          <td>{{ movimiento.descripcion }}</td>
          <td>{{ movimiento.importe }}</td>
          <td>{{ movimiento.saldo }}</td>
          <td class="space-x-2 text-right">
            <button class="text-blue-600" @click="editar(movimiento)">Editar</button>
            <button class="text-red-600" @click="eliminar(movimiento.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
