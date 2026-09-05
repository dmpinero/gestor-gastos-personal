<script setup lang="ts">
import { ChevronRight, Pencil } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { Movimiento } from '@/api/tipos'
import {
  claseColorImporte,
  claseFondoImporte,
  formatearFecha,
  formatearImporte,
} from '@/lib/formato'
import { agruparMovimientosParaTabla } from '@/lib/movimientosPorCategoria'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import BotonCopiarImporte from '@/componentes/compartido/BotonCopiarImporte.vue'
import IconoOrigenPdf from '@/componentes/compartido/IconoOrigenPdf.vue'
import { Button } from '@/componentes/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'

const props = defineProps<{ movimientos: Movimiento[] }>()
const emit = defineEmits<{ editar: [movimiento: Movimiento] }>()

const tiendaCategorias = useTiendaCategorias()
const tiendaCuentas = useTiendaCuentas()

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

function nombreCuenta(idCuenta: number): string {
  const cuenta = tiendaCuentas.cuentas.find((c) => c.id === idCuenta)
  return cuenta ? (cuenta.alias ?? cuenta.numero_cuenta) : ''
}

const grupos = computed(() =>
  agruparMovimientosParaTabla(props.movimientos, nombreCategoria, nombreSubcategoria),
)

// La columna del signo ausente ni se calcula ni se muestra si ningún
// movimiento recibido lo tiene (p. ej. ModalListaMovimientos siempre recibe
// movimientos de un único signo).
const hayGastos = computed(() => props.movimientos.some((m) => Number(m.importe) < 0))
const hayIngresos = computed(() => props.movimientos.some((m) => Number(m.importe) > 0))

const categoriasAbiertas = ref<Set<number>>(new Set())
const subcategoriasAbiertas = ref<Set<string>>(new Set())

function claveSubcategoria(idCategoria: number, idSubcategoria: number | null): string {
  return `${idCategoria}:${idSubcategoria}`
}

function alternarCategoria(idCategoria: number): void {
  const nuevo = new Set(categoriasAbiertas.value)
  if (nuevo.has(idCategoria)) nuevo.delete(idCategoria)
  else nuevo.add(idCategoria)
  categoriasAbiertas.value = nuevo
}

function alternarSubcategoria(clave: string): void {
  const nuevo = new Set(subcategoriasAbiertas.value)
  if (nuevo.has(clave)) nuevo.delete(clave)
  else nuevo.add(clave)
  subcategoriasAbiertas.value = nuevo
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <p v-if="grupos.length === 0" class="text-muted-foreground text-sm">No hay movimientos.</p>

    <div v-for="grupo in grupos" :key="grupo.categoriaId" class="overflow-hidden rounded-lg border">
      <button
        type="button"
        class="hover:bg-muted/50 flex w-full items-center gap-3 p-2 text-left"
        :aria-expanded="categoriasAbiertas.has(grupo.categoriaId)"
        @click="alternarCategoria(grupo.categoriaId)"
      >
        <ChevronRight
          class="size-4 shrink-0 transition-transform"
          :class="categoriasAbiertas.has(grupo.categoriaId) ? 'rotate-90' : ''"
        />
        <span class="flex-1 truncate font-medium">{{ grupo.nombre }}</span>
        <span
          v-if="hayGastos"
          class="text-destructive w-28 shrink-0 text-right text-sm tabular-nums"
          >{{ formatearImporte(grupo.totalGastado) }}</span
        >
        <span
          v-if="hayIngresos"
          class="text-success w-28 shrink-0 text-right text-sm tabular-nums dark:text-emerald-500"
          >{{ formatearImporte(grupo.totalIngresado) }}</span
        >
        <span class="text-muted-foreground w-20 shrink-0 text-right text-sm"
          >{{ grupo.numMovimientos }} mov.</span
        >
      </button>

      <div v-if="categoriasAbiertas.has(grupo.categoriaId)" class="border-t pl-6">
        <div
          v-for="sub in grupo.subcategorias"
          :key="claveSubcategoria(grupo.categoriaId, sub.subcategoriaId)"
          class="border-b last:border-b-0"
        >
          <button
            type="button"
            class="hover:bg-muted/50 flex w-full items-center gap-3 p-2 text-left"
            :aria-expanded="
              subcategoriasAbiertas.has(claveSubcategoria(grupo.categoriaId, sub.subcategoriaId))
            "
            @click="alternarSubcategoria(claveSubcategoria(grupo.categoriaId, sub.subcategoriaId))"
          >
            <ChevronRight
              class="size-4 shrink-0 transition-transform"
              :class="
                subcategoriasAbiertas.has(claveSubcategoria(grupo.categoriaId, sub.subcategoriaId))
                  ? 'rotate-90'
                  : ''
              "
            />
            <span class="flex-1 truncate text-sm">{{ sub.nombre }}</span>
            <span
              v-if="hayGastos"
              class="text-destructive w-28 shrink-0 text-right text-sm tabular-nums"
              >{{ formatearImporte(sub.totalGastado) }}</span
            >
            <span
              v-if="hayIngresos"
              class="text-success w-28 shrink-0 text-right text-sm tabular-nums dark:text-emerald-500"
              >{{ formatearImporte(sub.totalIngresado) }}</span
            >
            <span class="text-muted-foreground w-20 shrink-0 text-right text-sm"
              >{{ sub.movimientos.length }} mov.</span
            >
          </button>

          <Table
            v-if="
              subcategoriasAbiertas.has(claveSubcategoria(grupo.categoriaId, sub.subcategoriaId))
            "
            class="table-fixed"
          >
            <TableHeader>
              <TableRow>
                <TableHead class="w-[13%] whitespace-normal">Fecha</TableHead>
                <TableHead class="w-[15%] whitespace-normal">Cuenta</TableHead>
                <TableHead class="w-[37%] whitespace-normal">Descripción</TableHead>
                <TableHead class="w-[15%] text-right whitespace-normal">Importe</TableHead>
                <TableHead class="w-[13%] text-right whitespace-normal">Saldo</TableHead>
                <TableHead class="w-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="movimiento in sub.movimientos"
                :key="movimiento.id"
                :class="claseFondoImporte(movimiento.importe)"
              >
                <TableCell>{{ formatearFecha(movimiento.fecha_valor) }}</TableCell>
                <TableCell class="truncate" :title="nombreCuenta(movimiento.cuenta_id)">{{
                  nombreCuenta(movimiento.cuenta_id)
                }}</TableCell>
                <TableCell class="truncate" :title="movimiento.descripcion">
                  <div class="flex items-center gap-1.5">
                    <IconoOrigenPdf :origen="movimiento.origen" />
                    <span class="truncate">{{ movimiento.descripcion }}</span>
                  </div>
                </TableCell>
                <TableCell
                  class="text-right tabular-nums"
                  :class="claseColorImporte(movimiento.importe)"
                >
                  <div class="flex items-center justify-end gap-1.5">
                    <BotonCopiarImporte :valor="movimiento.importe" />
                    <span>{{ formatearImporte(movimiento.importe) }}</span>
                  </div>
                </TableCell>
                <TableCell class="text-right tabular-nums">{{
                  formatearImporte(movimiento.saldo)
                }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar"
                    @click="emit('editar', movimiento)"
                  >
                    <Pencil class="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  </div>
</template>
