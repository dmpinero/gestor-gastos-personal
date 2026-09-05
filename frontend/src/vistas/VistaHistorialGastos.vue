<script setup lang="ts">
import {
  CalendarDays,
  ChevronRight,
  Euro,
  FileText,
  Landmark,
  Layers,
  Pencil,
  Search,
  Tag,
  Tags,
  Wallet,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import type { Movimiento } from '@/api/tipos'
import { useBusquedaTabla } from '@/composables/useBusquedaTabla'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import { usePaginacionTabla, type TamanoPagina } from '@/composables/usePaginacionTabla'
import { claseFondoImporte, formatearFecha, formatearImporte } from '@/lib/formato'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import { useTiendaMovimientos } from '@/stores/movimientos'
import BarraPaginacion from '@/componentes/compartido/BarraPaginacion.vue'
import BotonesExportarTabla from '@/componentes/compartido/BotonesExportarTabla.vue'
import CabeceraOrdenable from '@/componentes/compartido/CabeceraOrdenable.vue'
import GraficoEvolucion from '@/componentes/compartido/GraficoEvolucion.vue'
import IconoOrigenPdf from '@/componentes/compartido/IconoOrigenPdf.vue'
import PanelEdicionMovimiento from '@/componentes/compartido/PanelEdicionMovimiento.vue'
import SelectorTamanoPagina from '@/componentes/compartido/SelectorTamanoPagina.vue'
import TablaMovimientosAgrupada from '@/componentes/compartido/TablaMovimientosAgrupada.vue'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/componentes/ui/collapsible'
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
const panelEdicion = ref<InstanceType<typeof PanelEdicionMovimiento> | null>(null)

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

// Rango de fecha completa "AAAA-MM-DD" (igual que en VistaMovimientos.vue); vacío = sin límite.
const desde = ref('')
const hasta = ref('')

const filtrosAbiertos = ref(true)
const resultadosAbiertos = ref(true)
// Agrupado por defecto: el Historial de una categoría/subcategoría se ve
// naturalmente organizado por categoría → subcategoría, sin tener que
// pulsar el botón cada vez.
const agrupadoPorCategoria = ref(true)

watch(
  () => ruta.fullPath,
  async () => {
    desde.value = ''
    hasta.value = ''
    if (ruta.name === 'historial-categoria') {
      tiendaMovimientos.cargarPorCategoria(Number(ruta.params.id))
    } else if (ruta.name === 'historial-subcategoria') {
      const idSubcategoria = Number(ruta.params.id)
      // El watcher es inmediato y puede dispararse antes de que
      // onMounted haya pedido las categorías: sin ellas no se puede
      // resolver a qué categoría pertenece esta subcategoría.
      if (tiendaCategorias.categorias.length === 0) {
        await tiendaCategorias.cargar()
      }
      const categoria = tiendaCategorias.categorias.find((c) =>
        c.subcategorias.some((s) => s.id === idSubcategoria),
      )
      if (categoria) {
        tiendaMovimientos.cargarPorSubcategoria(categoria.categoria.id, idSubcategoria)
      }
    } else {
      tiendaMovimientos.limpiar()
    }
  },
  { immediate: true },
)

const movimientosDelPeriodo = computed(() =>
  tiendaMovimientos.movimientos.filter((m) => {
    if (desde.value && m.fecha_valor < desde.value) return false
    if (hasta.value && m.fecha_valor > hasta.value) return false
    return true
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

// Una categoría/subcategoría puede tener tanto gastos como ingresos (p. ej.
// "Nómina y otras prestaciones"): se separan igual que en VistaMovimientos.vue.
const movimientosGastados = computed(() =>
  filasFiltradas.value.filter((m) => Number(m.importe) < 0),
)
const movimientosIngresados = computed(() =>
  filasFiltradas.value.filter((m) => Number(m.importe) > 0),
)

const totalGastado = computed(() =>
  movimientosGastados.value.reduce((suma, m) => suma + Number(m.importe), 0),
)
const totalIngresado = computed(() =>
  movimientosIngresados.value.reduce((suma, m) => suma + Number(m.importe), 0),
)

function datosGraficoDe(movimientos: Movimiento[]): { periodo: string; total: number }[] {
  const totalesPorPeriodo = new Map<string, number>()
  for (const m of movimientos) {
    const periodo = m.fecha_valor.slice(0, 7)
    totalesPorPeriodo.set(
      periodo,
      (totalesPorPeriodo.get(periodo) ?? 0) + Math.abs(Number(m.importe)),
    )
  }
  return [...totalesPorPeriodo.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, total]) => ({ periodo, total }))
}

const datosGraficoGastos = computed(() => datosGraficoDe(movimientosGastados.value))
const datosGraficoIngresos = computed(() => datosGraficoDe(movimientosIngresados.value))

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

const COLUMNAS_TABLA = [
  'Fecha',
  'Cuenta',
  'Categoría',
  'Subcategoría',
  'Descripción',
  'Importe',
  'Saldo',
]

// Exporta todas las filas filtradas/ordenadas (no solo la página actual),
// que es lo que un usuario espera de "exportar esta tabla".
const filasTablaParaExportar = computed(() =>
  filasOrdenadas.value.map((m) => [
    formatearFecha(m.fecha_valor),
    nombreCuenta(m.cuenta_id),
    nombreCategoria(m.categoria_id),
    nombreSubcategoria(m.subcategoria_id),
    m.descripcion,
    formatearImporte(m.importe),
    formatearImporte(m.saldo),
  ]),
)
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold">{{ titulo ?? 'Historial' }}</h2>

    <p v-if="!ruta.params.id" class="text-muted-foreground mt-4 text-sm">
      Selecciona una categoría o subcategoría en el menú lateral para ver su evolución.
    </p>

    <template v-else>
      <p v-if="tiendaMovimientos.error" class="text-destructive mt-2 text-sm" role="alert">
        {{ tiendaMovimientos.error }}
      </p>

      <PanelEdicionMovimiento ref="panelEdicion" />

      <div class="mt-4 flex flex-col gap-6">
        <div v-if="movimientosGastados.length > 0">
          <div class="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-muted-foreground text-sm font-medium"
                  >Total gastado</CardTitle
                >
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
                {{ movimientosGastados.length }}
              </CardContent>
            </Card>
          </div>
          <h3 class="text-muted-foreground mt-4 text-sm font-medium">Evolución de gastos</h3>
          <GraficoEvolucion :items="datosGraficoGastos" acento="gasto" class="mt-3" />
        </div>

        <div v-if="movimientosIngresados.length > 0">
          <div class="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-muted-foreground text-sm font-medium"
                  >Total ingresado</CardTitle
                >
              </CardHeader>
              <CardContent class="text-success text-2xl font-semibold dark:text-emerald-500">
                {{ formatearImporte(totalIngresado) }}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle class="text-muted-foreground text-sm font-medium">Movimientos</CardTitle>
              </CardHeader>
              <CardContent class="text-2xl font-semibold">
                {{ movimientosIngresados.length }}
              </CardContent>
            </Card>
          </div>
          <h3 class="text-muted-foreground mt-4 text-sm font-medium">Evolución de ingresos</h3>
          <GraficoEvolucion :items="datosGraficoIngresos" acento="ingreso" class="mt-3" />
        </div>
      </div>

      <div class="bg-muted/40 mt-4 flex flex-col gap-4 rounded-lg border p-4">
        <Collapsible v-model:open="filtrosAbiertos">
          <CollapsibleTrigger
            class="text-muted-foreground flex items-center gap-1 text-sm font-medium"
            :aria-label="filtrosAbiertos ? 'Contraer filtros' : 'Expandir filtros'"
          >
            <ChevronRight
              class="size-4 transition-transform"
              :class="filtrosAbiertos ? 'rotate-90' : ''"
            />
            Filtros
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-4 flex flex-wrap items-end gap-4">
            <div class="flex max-w-48 flex-1 flex-col gap-1.5">
              <Label for="historial-fecha-desde">Fecha desde</Label>
              <Input id="historial-fecha-desde" v-model="desde" type="date" />
            </div>
            <div class="flex max-w-48 flex-1 flex-col gap-1.5">
              <Label for="historial-fecha-hasta">Fecha hasta</Label>
              <Input id="historial-fecha-hasta" v-model="hasta" type="date" />
            </div>
            <div v-if="!agrupadoPorCategoria" class="flex max-w-xs flex-col gap-1.5">
              <Label for="buscar-historial">Buscar</Label>
              <div class="relative">
                <Search
                  class="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4"
                />
                <Input
                  id="buscar-historial"
                  v-model="busqueda"
                  placeholder="Buscar movimientos…"
                  class="pl-8"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div class="bg-muted/40 mt-4 flex flex-col gap-4 rounded-lg border p-4">
        <Collapsible v-model:open="resultadosAbiertos">
          <CollapsibleTrigger
            class="text-muted-foreground flex items-center gap-1 text-sm font-medium"
            :aria-label="resultadosAbiertos ? 'Contraer resultados' : 'Expandir resultados'"
          >
            <ChevronRight
              class="size-4 transition-transform"
              :class="resultadosAbiertos ? 'rotate-90' : ''"
            />
            Resultados
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-4">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SelectorTamanoPagina
                  v-if="!agrupadoPorCategoria"
                  v-model="tamanoPagina"
                  id-base="historial"
                />
              </div>
              <div class="flex items-center gap-3">
                <p v-if="!agrupadoPorCategoria" class="text-muted-foreground text-sm">
                  Mostrando {{ primerIndice }}–{{ ultimoIndice }} de {{ totalRegistros }}
                  movimientos
                </p>
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
                  nombre-fichero="Historial"
                  titulo="Historial"
                  :columnas="COLUMNAS_TABLA"
                  :filas="filasTablaParaExportar"
                />
              </div>
            </div>

            <TablaMovimientosAgrupada
              v-if="agrupadoPorCategoria"
              :movimientos="filasFiltradas"
              class="mt-4"
              @editar="panelEdicion?.abrirParaEditar"
            />

            <Table v-else class="mt-4 table-fixed">
              <TableHeader>
                <TableRow>
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
                  <TableHead class="w-[13%] whitespace-normal">
                    <CabeceraOrdenable
                      :icono="Tag"
                      color-icono="text-violet-500"
                      :activo="campo === 'categoria_id'"
                      :direccion="direccion"
                      @ordenar="ordenarPor('categoria_id')"
                      >Categoría</CabeceraOrdenable
                    >
                  </TableHead>
                  <TableHead class="w-[15%] whitespace-normal">
                    <CabeceraOrdenable
                      :icono="Tags"
                      color-icono="text-rose-500"
                      :activo="campo === 'subcategoria_id'"
                      :direccion="direccion"
                      @ordenar="ordenarPor('subcategoria_id')"
                      >Subcategoría</CabeceraOrdenable
                    >
                  </TableHead>
                  <TableHead class="w-[22%] whitespace-normal">
                    <CabeceraOrdenable
                      :icono="FileText"
                      color-icono="text-slate-500"
                      :activo="campo === 'descripcion'"
                      :direccion="direccion"
                      @ordenar="ordenarPor('descripcion')"
                      >Descripción</CabeceraOrdenable
                    >
                  </TableHead>
                  <TableHead class="w-[12%] whitespace-normal">
                    <CabeceraOrdenable
                      :icono="Euro"
                      color-icono="text-amber-500"
                      :activo="campo === 'importe'"
                      :direccion="direccion"
                      @ordenar="ordenarPor('importe')"
                      >Importe</CabeceraOrdenable
                    >
                  </TableHead>
                  <TableHead class="w-[12%] whitespace-normal">
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
                <TableRow
                  v-for="movimiento in filasPagina"
                  :key="movimiento.id"
                  :class="claseFondoImporte(movimiento.importe)"
                >
                  <TableCell>{{ formatearFecha(movimiento.fecha_valor) }}</TableCell>
                  <TableCell class="truncate" :title="nombreCuenta(movimiento.cuenta_id)">{{
                    nombreCuenta(movimiento.cuenta_id)
                  }}</TableCell>
                  <TableCell class="truncate" :title="nombreCategoria(movimiento.categoria_id)">{{
                    nombreCategoria(movimiento.categoria_id)
                  }}</TableCell>
                  <TableCell
                    class="truncate"
                    :title="nombreSubcategoria(movimiento.subcategoria_id)"
                    >{{ nombreSubcategoria(movimiento.subcategoria_id) }}</TableCell
                  >
                  <TableCell class="truncate" :title="movimiento.descripcion">
                    <div class="flex items-center gap-1.5">
                      <IconoOrigenPdf :origen="movimiento.origen" />
                      <span class="truncate">{{ movimiento.descripcion }}</span>
                    </div>
                  </TableCell>
                  <TableCell>{{ formatearImporte(movimiento.importe) }}</TableCell>
                  <TableCell>{{ formatearImporte(movimiento.saldo) }}</TableCell>
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

            <BarraPaginacion
              v-if="!agrupadoPorCategoria && totalPaginas > 1"
              :pagina-actual="paginaActual"
              :total-paginas="totalPaginas"
              @anterior="paginaAnterior"
              @siguiente="paginaSiguiente"
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      <p
        v-if="filasOrdenadas.length === 0 && !tiendaMovimientos.cargando"
        class="text-muted-foreground mt-4 text-sm"
      >
        No hay movimientos registrados para {{ titulo }}.
      </p>
    </template>
  </section>
</template>
