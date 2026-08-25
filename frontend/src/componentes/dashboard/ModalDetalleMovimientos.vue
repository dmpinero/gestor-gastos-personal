<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDays, Euro, FileText, Pencil, Tags } from '@lucide/vue'
import type { Movimiento } from '@/api/tipos'
import { formatearFecha, formatearImporte } from '@/lib/formato'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import BotonesExportarTabla from '@/componentes/compartido/BotonesExportarTabla.vue'
import CabeceraOrdenable from '@/componentes/compartido/CabeceraOrdenable.vue'
import PanelEdicionMovimiento from '@/componentes/compartido/PanelEdicionMovimiento.vue'
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
import type { MovimientoDeCategoria } from './ListaTotalesCategoria.vue'

// Cada categoría del listado abre su propia modal (una instancia de este
// componente por categoría, dentro de un v-for); al vivir la ordenación
// aquí dentro, cada modal tiene su propio estado independiente en vez de
// compartir uno solo entre todas las categorías.
const props = defineProps<{
  nombreCategoria: string
  total: string
  movimientos: MovimientoDeCategoria[]
}>()

const { campo, direccion, ordenarPor, filasOrdenadas } = useOrdenacionTabla(
  computed(() => props.movimientos),
  {
    fecha: (a: MovimientoDeCategoria, b: MovimientoDeCategoria) => a.fecha.localeCompare(b.fecha),
    descripcion: (a: MovimientoDeCategoria, b: MovimientoDeCategoria) =>
      a.descripcion.localeCompare(b.descripcion),
    subcategoria: (a: MovimientoDeCategoria, b: MovimientoDeCategoria) =>
      a.subcategoria.localeCompare(b.subcategoria),
    importe: (a: MovimientoDeCategoria, b: MovimientoDeCategoria) =>
      Number(a.importe) - Number(b.importe),
  },
)

const COLUMNAS_DETALLE = ['Fecha', 'Descripción', 'Categoría', 'Subcategoría', 'Importe']

const filasParaExportar = computed(() =>
  filasOrdenadas.value.map((m) => [
    formatearFecha(m.fecha),
    m.descripcion,
    props.nombreCategoria,
    m.subcategoria,
    formatearImporte(m.importe),
  ]),
)

const panelEdicion = ref<InstanceType<typeof PanelEdicionMovimiento> | null>(null)

function aMovimiento(m: MovimientoDeCategoria): Movimiento {
  return {
    id: m.id,
    cuenta_id: m.cuenta_id,
    categoria_id: m.categoria_id,
    subcategoria_id: m.subcategoria_id,
    fecha_valor: m.fecha,
    descripcion: m.descripcion,
    comentario: m.comentario,
    importe: m.importe,
    saldo: m.saldo,
  }
}
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="link" class="h-auto shrink-0 p-0 text-xs">Detalles</Button>
    </DialogTrigger>
    <DialogContent class="flex max-h-[85vh] max-w-5xl flex-col">
      <DialogHeader class="shrink-0">
        <div class="flex items-center justify-between gap-4 pr-6">
          <DialogTitle>{{ nombreCategoria }}</DialogTitle>
          <BotonesExportarTabla
            :nombre-fichero="nombreCategoria"
            :titulo="nombreCategoria"
            :columnas="COLUMNAS_DETALLE"
            :filas="filasParaExportar"
          />
        </div>
        <DialogDescription>
          Total: {{ formatearImporte(total) }} · {{ movimientos.length }} movimiento{{
            movimientos.length === 1 ? '' : 's'
          }}
        </DialogDescription>
      </DialogHeader>
      <PanelEdicionMovimiento ref="panelEdicion" />
      <div class="min-h-0 flex-1 overflow-auto">
        <Table class="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead class="w-[15%] whitespace-normal">
                <CabeceraOrdenable
                  :icono="CalendarDays"
                  color-icono="text-blue-500"
                  :activo="campo === 'fecha'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('fecha')"
                  >Fecha</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-[35%] whitespace-normal">
                <CabeceraOrdenable
                  :icono="FileText"
                  color-icono="text-slate-500"
                  :activo="campo === 'descripcion'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('descripcion')"
                  >Descripción</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-[20%] whitespace-normal">Categoría</TableHead>
              <TableHead class="w-[20%] whitespace-normal">
                <CabeceraOrdenable
                  :icono="Tags"
                  color-icono="text-rose-500"
                  :activo="campo === 'subcategoria'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('subcategoria')"
                  >Subcategoría</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-[10%] text-right whitespace-normal">
                <CabeceraOrdenable
                  :icono="Euro"
                  color-icono="text-amber-500"
                  :activo="campo === 'importe'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('importe')"
                  >Importe</CabeceraOrdenable
                >
              </TableHead>
              <TableHead class="w-9"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="movimiento in filasOrdenadas" :key="movimiento.id">
              <TableCell>{{ formatearFecha(movimiento.fecha) }}</TableCell>
              <TableCell class="truncate" :title="movimiento.descripcion">{{
                movimiento.descripcion
              }}</TableCell>
              <TableCell class="truncate" :title="nombreCategoria">{{ nombreCategoria }}</TableCell>
              <TableCell class="truncate" :title="movimiento.subcategoria">{{
                movimiento.subcategoria
              }}</TableCell>
              <TableCell class="text-right tabular-nums">{{
                formatearImporte(movimiento.importe)
              }}</TableCell>
              <TableCell class="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar"
                  @click="panelEdicion?.abrirParaEditar(aMovimiento(movimiento))"
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
