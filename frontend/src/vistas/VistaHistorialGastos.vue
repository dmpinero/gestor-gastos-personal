<script setup lang="ts">
import { CalendarDays, Euro, FileText, Landmark, Search, Tag, Tags, Wallet } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import type { Movimiento } from '@/api/tipos'
import { useBusquedaTabla } from '@/composables/useBusquedaTabla'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import { formatearFecha, formatearImporte } from '@/lib/formato'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import { useTiendaMovimientos } from '@/stores/movimientos'
import CabeceraOrdenable from '@/componentes/compartido/CabeceraOrdenable.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'

const TODOS = 'todos'

const MESES = [
  { valor: '01', etiqueta: 'Enero' },
  { valor: '02', etiqueta: 'Febrero' },
  { valor: '03', etiqueta: 'Marzo' },
  { valor: '04', etiqueta: 'Abril' },
  { valor: '05', etiqueta: 'Mayo' },
  { valor: '06', etiqueta: 'Junio' },
  { valor: '07', etiqueta: 'Julio' },
  { valor: '08', etiqueta: 'Agosto' },
  { valor: '09', etiqueta: 'Septiembre' },
  { valor: '10', etiqueta: 'Octubre' },
  { valor: '11', etiqueta: 'Noviembre' },
  { valor: '12', etiqueta: 'Diciembre' },
]

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

const anioSeleccionado = ref(TODOS)
const mesSeleccionado = ref(TODOS)

watch(
  () => ruta.fullPath,
  () => {
    anioSeleccionado.value = TODOS
    mesSeleccionado.value = TODOS
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

const aniosDisponibles = computed(() => {
  const anios = new Set(tiendaMovimientos.movimientos.map((m) => m.fecha_valor.slice(0, 4)))
  return [...anios].sort((a, b) => b.localeCompare(a))
})

const movimientosDelPeriodo = computed(() =>
  tiendaMovimientos.movimientos.filter((m) => {
    const coincideAnio =
      anioSeleccionado.value === TODOS || m.fecha_valor.slice(0, 4) === anioSeleccionado.value
    const coincideMes =
      mesSeleccionado.value === TODOS || m.fecha_valor.slice(5, 7) === mesSeleccionado.value
    return coincideAnio && coincideMes
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
        <div class="flex max-w-40 flex-1 flex-col gap-1.5">
          <Label id="etiqueta-anio" for="selector-anio">Año</Label>
          <Select v-model="anioSeleccionado">
            <SelectTrigger id="selector-anio" aria-labelledby="etiqueta-anio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="TODOS">Todos los años</SelectItem>
              <SelectItem v-for="anio in aniosDisponibles" :key="anio" :value="anio">
                {{ anio }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex max-w-48 flex-1 flex-col gap-1.5">
          <Label id="etiqueta-mes" for="selector-mes">Mes</Label>
          <Select v-model="mesSeleccionado">
            <SelectTrigger id="selector-mes" aria-labelledby="etiqueta-mes">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="TODOS">Todos los meses</SelectItem>
              <SelectItem v-for="mes in MESES" :key="mes.valor" :value="mes.valor">
                {{ mes.etiqueta }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="mt-4 flex max-w-xs flex-col gap-1.5">
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
          <TableRow v-for="movimiento in filasOrdenadas" :key="movimiento.id">
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

      <p
        v-if="filasOrdenadas.length === 0 && !tiendaMovimientos.cargando"
        class="text-muted-foreground mt-4 text-sm"
      >
        No hay gastos registrados para {{ titulo }}.
      </p>
    </template>
  </section>
</template>
