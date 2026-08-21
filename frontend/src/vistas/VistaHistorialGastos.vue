<script setup lang="ts">
import { CalendarDays, Euro, FileText, Landmark, Search, Tag, Tags, Wallet } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import type { Movimiento } from '@/api/tipos'
import { useBusquedaTabla } from '@/composables/useBusquedaTabla'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import { usePaginacionTabla, type TamanoPagina } from '@/composables/usePaginacionTabla'
import { formatearFecha, formatearImporte } from '@/lib/formato'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import { useTiendaMovimientos } from '@/stores/movimientos'
import BarraPaginacion from '@/componentes/compartido/BarraPaginacion.vue'
import CabeceraOrdenable from '@/componentes/compartido/CabeceraOrdenable.vue'
import GraficoEvolucion from '@/componentes/compartido/GraficoEvolucion.vue'
import SelectorTamanoPagina from '@/componentes/compartido/SelectorTamanoPagina.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
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

const ruta = useRoute()
const tiendaCuentas = useTiendaCuentas()
const tiendaCategorias = useTiendaCategorias()
const tiendaMovimientos = useTiendaMovimientos()

function compararTexto(a: string, b: string): number {
  return a.localeCompare(b)
}

function nombreCuenta(idCuenta: number): string {
  const cuenta = tiendaCuentas.cuentas.find((c) => c.id === idCuenta)
  return cuenta ? (cuenta.alias ?? cuenta.numero_cuenta) : ''
}

function nombreCategoria(idCategoria: number): string {
  return (
    tiendaCategorias.categorias.find((c) => c.categoria.id === idCategoria)?.categoria.nombre ?? ''
  )
}

function nombreSubcategoria(idSubcategoria: number | null): string {
  if (idSubcategoria === null) return ''
  for (const c of tiendaCategorias.categorias) {
    const sub = c.subcategorias.find((s) => s.id === idSubcategoria)
    if (sub) return sub.nombre
  }
  return ''
}

const titulo = computed<string | null>(() => {
  if (ruta.name === 'historial-categoria') {
    return nombreCategoria(Number(ruta.params.id)) || null
  }
  if (ruta.name === 'historial-subcategoria') {
    const idSubcategoria = Number(ruta.params.id)
    for (const c of tiendaCategorias.categorias) {
      const sub = c.subcategorias.find((s) => s.id === idSubcategoria)
      if (sub) return `${c.categoria.nombre} → ${sub.nombre}`
    }
    return null
  }
  return null
})

onMounted(() => {
  tiendaCuentas.cargar()
  tiendaCategorias.cargar()
})

// Rango de periodo "AAAA-MM" (formato nativo de <input type="month">); vacío = sin límite.
const desde = ref('')
const hasta = ref('')

watch(
  () => ruta.fullPath,
  () => {
    desde.value = ''
    hasta.value = ''
    if (ruta.name === 'historial-categoria') {
      tiendaMovimientos.cargarPorCategoria(Number(ruta.params.id))
    } else if (ruta.name === 'historial-subcategoria') {
      tiendaMovimientos.cargarPorSubcategoria(Number(ruta.params.id))
    } else {
      tiendaMovimientos.limpiar()
    }
  },
  { immediate: true },
)

const movimientosDelPeriodo = computed(() =>
  tiendaMovimientos.movimientos.filter((m) => {
    const periodo = m.fecha_valor.slice(0, 7)
    const cumpleDesde = !desde.value || periodo >= desde.value
    const cumpleHasta = !hasta.value || periodo <= hasta.value
    return cumpleDesde && cumpleHasta
  }),
)

const { busqueda, filasFiltradas } = useBusquedaTabla(movimientosDelPeriodo, (m) => [
  formatearFecha(m.fecha_valor),
  nombreCuenta(m.cuenta_id),
  m.descripcion,
  nombreCategoria(m.categoria_id),
  nombreSubcategoria(m.subcategoria_id),
  m.importe,
  m.saldo,
])

const totalGastado = computed(() =>
  filasFiltradas.value.reduce((suma, m) => suma + Number(m.importe), 0),
)

const datosGrafico = computed(() => {
  const totalesPorPeriodo = new Map<string, number>()
  for (const m of filasFiltradas.value) {
    const periodo = m.fecha_valor.slice(0, 7)
    totalesPorPeriodo.set(
      periodo,
      (totalesPorPeriodo.get(periodo) ?? 0) + Math.abs(Number(m.importe)),
    )
  }
  return [...totalesPorPeriodo.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, total]) => ({ periodo, total }))
})

const { campo, direccion, ordenarPor, filasOrdenadas } = useOrdenacionTabla(filasFiltradas, {
  fecha_valor: (a: Movimiento, b: Movimiento) => a.fecha_valor.localeCompare(b.fecha_valor),
  cuenta_id: (a: Movimiento, b: Movimiento) =>
    compararTexto(nombreCuenta(a.cuenta_id), nombreCuenta(b.cuenta_id)),
  descripcion: (a: Movimiento, b: Movimiento) => a.descripcion.localeCompare(b.descripcion),
  categoria_id: (a: Movimiento, b: Movimiento) =>
    compararTexto(nombreCategoria(a.categoria_id), nombreCategoria(b.categoria_id)),
  subcategoria_id: (a: Movimiento, b: Movimiento) =>
    compararTexto(nombreSubcategoria(a.subcategoria_id), nombreSubcategoria(b.subcategoria_id)),
  importe: (a: Movimiento, b: Movimiento) => Number(a.importe) - Number(b.importe),
  saldo: (a: Movimiento, b: Movimiento) => Number(a.saldo) - Number(b.saldo),
})

const tamanoPagina = ref<TamanoPagina>(10)
const {
  filasPagina,
  paginaActual,
  totalPaginas,
  totalRegistros,
  primerIndice,
  ultimoIndice,
  paginaSiguiente,
  paginaAnterior,
} = usePaginacionTabla(filasOrdenadas, tamanoPagina)

// Al buscar se vuelve a la página 1 para ver los resultados desde el principio.
watch(busqueda, () => {
  paginaActual.value = 1
})
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold">{{ titulo ?? 'Historial de gastos' }}</h2>

    <p v-if="!ruta.params.id" class="text-muted-foreground mt-4 text-sm">
      Selecciona una categoría o subcategoría en el menú lateral para ver su evolución.
    </p>

    <template v-else>
      <p v-if="tiendaMovimientos.error" class="text-destructive mt-2 text-sm" role="alert">
        {{ tiendaMovimientos.error }}
      </p>

      <div class="mt-4 grid grid-cols-2 gap-4 sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle class="text-muted-foreground text-sm font-medium">Total gastado</CardTitle>
          </CardHeader>
          <CardContent class="text-destructive text-2xl font-semibold">
            {{ formatearImporte(totalGastado) }}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle class="text-muted-foreground text-sm font-medium">Movimientos</CardTitle>
          </CardHeader>
          <CardContent class="text-2xl font-semibold">
            {{ filasFiltradas.length }}
          </CardContent>
        </Card>
      </div>

      <div class="mt-4 flex flex-wrap gap-4">
        <div class="flex max-w-48 flex-1 flex-col gap-1.5">
          <Label for="periodo-desde">Desde</Label>
          <Input id="periodo-desde" v-model="desde" type="month" :max="hasta || undefined" />
        </div>
        <div class="flex max-w-48 flex-1 flex-col gap-1.5">
          <Label for="periodo-hasta">Hasta</Label>
          <Input id="periodo-hasta" v-model="hasta" type="month" :min="desde || undefined" />
        </div>
      </div>

      <div v-if="datosGrafico.length > 0" class="mt-4">
        <h3 class="text-muted-foreground text-sm font-medium">Evolución</h3>
        <GraficoEvolucion :items="datosGrafico" acento="gasto" class="mt-3" />
      </div>

      <div
        class="bg-muted/40 mt-4 flex flex-wrap items-end justify-between gap-4 rounded-lg border p-4"
      >
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex max-w-xs flex-col gap-1.5">
            <Label for="buscar-historial">Buscar</Label>
            <div class="relative">
              <Search
                class="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4"
              />
              <Input
                id="buscar-historial"
                v-model="busqueda"
                placeholder="Buscar gastos…"
                class="pl-8"
              />
            </div>
          </div>
          <SelectorTamanoPagina v-model="tamanoPagina" id-base="historial" />
        </div>
        <p class="text-muted-foreground text-sm">
          Mostrando {{ primerIndice }}–{{ ultimoIndice }} de {{ totalRegistros }} gastos
        </p>
      </div>

      <Table class="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>
              <CabeceraOrdenable
                :icono="CalendarDays"
                color-icono="text-blue-500"
                :activo="campo === 'fecha_valor'"
                :direccion="direccion"
                @ordenar="ordenarPor('fecha_valor')"
                >Fecha</CabeceraOrdenable
              >
            </TableHead>
            <TableHead>
              <CabeceraOrdenable
                :icono="Landmark"
                color-icono="text-indigo-500"
                :activo="campo === 'cuenta_id'"
                :direccion="direccion"
                @ordenar="ordenarPor('cuenta_id')"
                >Cuenta</CabeceraOrdenable
              >
            </TableHead>
            <TableHead>
              <CabeceraOrdenable
                :icono="Tag"
                color-icono="text-violet-500"
                :activo="campo === 'categoria_id'"
                :direccion="direccion"
                @ordenar="ordenarPor('categoria_id')"
                >Categoría</CabeceraOrdenable
              >
            </TableHead>
            <TableHead>
              <CabeceraOrdenable
                :icono="Tags"
                color-icono="text-rose-500"
                :activo="campo === 'subcategoria_id'"
                :direccion="direccion"
                @ordenar="ordenarPor('subcategoria_id')"
                >Subcategoría</CabeceraOrdenable
              >
            </TableHead>
            <TableHead>
              <CabeceraOrdenable
                :icono="FileText"
                color-icono="text-slate-500"
                :activo="campo === 'descripcion'"
                :direccion="direccion"
                @ordenar="ordenarPor('descripcion')"
                >Descripción</CabeceraOrdenable
              >
            </TableHead>
            <TableHead>
              <CabeceraOrdenable
                :icono="Euro"
                color-icono="text-amber-500"
                :activo="campo === 'importe'"
                :direccion="direccion"
                @ordenar="ordenarPor('importe')"
                >Importe</CabeceraOrdenable
              >
            </TableHead>
            <TableHead>
              <CabeceraOrdenable
                :icono="Wallet"
                color-icono="text-teal-500"
                :activo="campo === 'saldo'"
                :direccion="direccion"
                @ordenar="ordenarPor('saldo')"
                >Saldo</CabeceraOrdenable
              >
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="movimiento in filasPagina" :key="movimiento.id">
            <TableCell>{{ formatearFecha(movimiento.fecha_valor) }}</TableCell>
            <TableCell>{{ nombreCuenta(movimiento.cuenta_id) }}</TableCell>
            <TableCell>{{ nombreCategoria(movimiento.categoria_id) }}</TableCell>
            <TableCell>{{ nombreSubcategoria(movimiento.subcategoria_id) }}</TableCell>
            <TableCell>{{ movimiento.descripcion }}</TableCell>
            <TableCell>{{ formatearImporte(movimiento.importe) }}</TableCell>
            <TableCell>{{ formatearImporte(movimiento.saldo) }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <BarraPaginacion
        v-if="totalPaginas > 1"
        :pagina-actual="paginaActual"
        :total-paginas="totalPaginas"
        @anterior="paginaAnterior"
        @siguiente="paginaSiguiente"
      />

      <p
        v-if="filasOrdenadas.length === 0 && !tiendaMovimientos.cargando"
        class="text-muted-foreground mt-4 text-sm"
      >
        No hay gastos registrados para {{ titulo }}.
      </p>
    </template>
  </section>
</template>
