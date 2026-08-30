<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CalendarDays,
  Euro,
  FileText,
  Landmark,
  Layers,
  Pencil,
  Tag,
  Tags,
  Wallet,
} from '@lucide/vue'
import type { Movimiento } from '@/api/tipos'
import { formatearFecha, formatearImporte } from '@/lib/formato'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import BotonesExportarTabla from './BotonesExportarTabla.vue'
import CabeceraOrdenable from './CabeceraOrdenable.vue'
import PanelEdicionMovimiento from './PanelEdicionMovimiento.vue'
import TablaMovimientosAgrupada from './TablaMovimientosAgrupada.vue'
import { Button } from '@/componentes/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/componentes/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'

const props = defineProps<{
  titulo: string
  movimientos: Movimiento[]
}>()

const tiendaCuentas = useTiendaCuentas()
const tiendaCategorias = useTiendaCategorias()
const panelEdicion = ref<InstanceType<typeof PanelEdicionMovimiento> | null>(null)
const agrupadoPorCategoria = ref(false)

function nombreCuenta(id: number): string {
  const cuenta = tiendaCuentas.cuentas.find((c) => c.id === id)
  return cuenta ? (cuenta.alias ?? cuenta.numero_cuenta) : ''
}

function nombreCategoria(id: number): string {
  return tiendaCategorias.categorias.find((c) => c.categoria.id === id)?.categoria.nombre ?? ''
}

function nombreSubcategoria(id: number | null): string {
  if (id === null) return ''
  for (const c of tiendaCategorias.categorias) {
    const sub = c.subcategorias.find((s) => s.id === id)
    if (sub) return sub.nombre
  }
  return ''
}

const { campo, direccion, ordenarPor, filasOrdenadas } = useOrdenacionTabla(
  computed(() => props.movimientos),
  {
    cuenta_id: (a: Movimiento, b: Movimiento) =>
      nombreCuenta(a.cuenta_id).localeCompare(nombreCuenta(b.cuenta_id)),
    fecha_valor: (a: Movimiento, b: Movimiento) => a.fecha_valor.localeCompare(b.fecha_valor),
    descripcion: (a: Movimiento, b: Movimiento) => a.descripcion.localeCompare(b.descripcion),
    categoria_id: (a: Movimiento, b: Movimiento) =>
      nombreCategoria(a.categoria_id).localeCompare(nombreCategoria(b.categoria_id)),
    subcategoria_id: (a: Movimiento, b: Movimiento) =>
      nombreSubcategoria(a.subcategoria_id).localeCompare(nombreSubcategoria(b.subcategoria_id)),
    importe: (a: Movimiento, b: Movimiento) => Number(a.importe) - Number(b.importe),
    saldo: (a: Movimiento, b: Movimiento) => Number(a.saldo) - Number(b.saldo),
  },
)

const COLUMNAS_DETALLE = [
  'Cuenta',
  'Fecha',
  'Descripción',
  'Categoría',
  'Subcategoría',
  'Importe',
  'Saldo',
]

const filasParaExportar = computed(() =>
  filasOrdenadas.value.map((m) => [
    nombreCuenta(m.cuenta_id),
    formatearFecha(m.fecha_valor),
    m.descripcion,
    nombreCategoria(m.categoria_id),
    nombreSubcategoria(m.subcategoria_id),
    formatearImporte(m.importe),
    formatearImporte(m.saldo),
  ]),
)
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot name="disparador">
        <Button variant="link" class="h-auto shrink-0 p-0 text-xs">Detalles</Button>
      </slot>
    </DialogTrigger>
    <DialogContent class="flex max-h-[85vh] max-w-5xl flex-col">
      <DialogHeader class="shrink-0">
        <div class="flex items-center justify-between gap-4 pr-6">
          <DialogTitle>{{ titulo }}</DialogTitle>
          <div class="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="agrupadoPorCategoria = !agrupadoPorCategoria"
            >
              <Layers class="size-4" />
              {{ agrupadoPorCategoria ? 'Ver todos los movimientos' : 'Agrupar por categoría' }}
            </Button>
            <BotonesExportarTabla
              :nombre-fichero="titulo"
              :titulo="titulo"
              :columnas="COLUMNAS_DETALLE"
              :filas="filasParaExportar"
            />
          </div>
        </div>
        <DialogDescription>
          {{ movimientos.length }} movimiento{{ movimientos.length === 1 ? '' : 's' }}
        </DialogDescription>
      </DialogHeader>
      <PanelEdicionMovimiento ref="panelEdicion" />
      <TablaMovimientosAgrupada
        v-if="agrupadoPorCategoria"
        :movimientos="movimientos"
        class="min-h-0 flex-1 overflow-auto"
        @editar="panelEdicion?.abrirParaEditar"
      />
      <div v-else class="min-h-0 flex-1 overflow-auto">
        <Table class="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead class="w-[13%] whitespace-normal">
                <CabeceraOrdenable
                  :icono="Landmark"
                  color-icono="text-indigo-500"
                  :activo="campo === 'cuenta_id'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('cuenta_id')"
                  >Cuenta</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-[11%] whitespace-normal">
                <CabeceraOrdenable
                  :icono="CalendarDays"
                  color-icono="text-blue-500"
                  :activo="campo === 'fecha_valor'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('fecha_valor')"
                  >Fecha</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-[27%] whitespace-normal">
                <CabeceraOrdenable
                  :icono="FileText"
                  color-icono="text-slate-500"
                  :activo="campo === 'descripcion'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('descripcion')"
                  >Descripción</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-[15%] whitespace-normal">
                <CabeceraOrdenable
                  :icono="Tag"
                  color-icono="text-violet-500"
                  :activo="campo === 'categoria_id'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('categoria_id')"
                  >Categoría</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-[16%] whitespace-normal">
                <CabeceraOrdenable
                  :icono="Tags"
                  color-icono="text-rose-500"
                  :activo="campo === 'subcategoria_id'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('subcategoria_id')"
                  >Subcategoría</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-[9%] text-right whitespace-normal">
                <CabeceraOrdenable
                  :icono="Euro"
                  color-icono="text-amber-500"
                  :activo="campo === 'importe'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('importe')"
                  >Importe</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-[9%] text-right whitespace-normal">
                <CabeceraOrdenable
                  :icono="Wallet"
                  color-icono="text-teal-500"
                  :activo="campo === 'saldo'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('saldo')"
                  >Saldo</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-9"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="movimiento in filasOrdenadas" :key="movimiento.id">
              <TableCell class="truncate" :title="nombreCuenta(movimiento.cuenta_id)">{{
                nombreCuenta(movimiento.cuenta_id)
              }}</TableCell>
              <TableCell>{{ formatearFecha(movimiento.fecha_valor) }}</TableCell>
              <TableCell class="truncate" :title="movimiento.descripcion">{{
                movimiento.descripcion
              }}</TableCell>
              <TableCell class="truncate" :title="nombreCategoria(movimiento.categoria_id)">{{
                nombreCategoria(movimiento.categoria_id)
              }}</TableCell>
              <TableCell class="truncate" :title="nombreSubcategoria(movimiento.subcategoria_id)">{{
                nombreSubcategoria(movimiento.subcategoria_id)
              }}</TableCell>
              <TableCell class="text-right tabular-nums">{{
                formatearImporte(movimiento.importe)
              }}</TableCell>
              <TableCell class="text-right tabular-nums">{{
                formatearImporte(movimiento.saldo)
              }}</TableCell>
              <TableCell class="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar"
                  @click="panelEdicion?.abrirParaEditar(movimiento)"
                >
                  <Pencil class="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>
</template>
