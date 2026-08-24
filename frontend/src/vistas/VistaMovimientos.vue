<script setup lang="ts">
import {
  CalendarDays,
  ChevronRight,
  Euro,
  FileText,
  Landmark,
  Pencil,
  Search,
  Tag,
  Tags,
  Trash2,
  Wallet,
} from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import type { DatosMovimiento, Movimiento, TotalCategoria } from '@/api/tipos'
import { aTextoOULlo } from '@/api/utilidades'
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
import FiltroMultiple from '@/componentes/compartido/FiltroMultiple.vue'
import FiltroRangoNumero from '@/componentes/compartido/FiltroRangoNumero.vue'
import GraficoComparativoEvolucion from '@/componentes/compartido/GraficoComparativoEvolucion.vue'
import GraficoEvolucion from '@/componentes/compartido/GraficoEvolucion.vue'
import SelectorTamanoPagina from '@/componentes/compartido/SelectorTamanoPagina.vue'
import ListaTotalesCategoria, {
  type MovimientoDeCategoria,
} from '@/componentes/dashboard/ListaTotalesCategoria.vue'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Checkbox } from '@/componentes/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/componentes/ui/collapsible'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/ui/select'
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

const ruta = useRoute()
const tiendaCuentas = useTiendaCuentas()
const tiendaCategorias = useTiendaCategorias()
const tiendaMovimientos = useTiendaMovimientos()

const cuentasSeleccionadas = ref<number[]>([])
const error = ref<string | null>(null)
const idEnEdicion = ref<number | null>(null)
const panelAbierto = ref(false)
const seleccionados = ref<Set<number>>(new Set())

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

// Los componentes Select trabajan con valores de texto; estos proxies traducen
// entre esa representación y los identificadores numéricos del formulario.
const cuentaFormularioTexto = computed<string | undefined>({
  get: () => (formulario.cuenta_id ? String(formulario.cuenta_id) : undefined),
  set: (valor) => {
    formulario.cuenta_id = valor === undefined ? 0 : Number(valor)
  },
})

const categoriaSeleccionadaTexto = computed<string | undefined>({
  get: () => (formulario.categoria_id ? String(formulario.categoria_id) : undefined),
  set: (valor) => {
    formulario.categoria_id = valor === undefined ? 0 : Number(valor)
    formulario.subcategoria_id = null
  },
})

const SIN_SUBCATEGORIA = 'sin-subcategoria'

const subcategoriaSeleccionadaTexto = computed<string>({
  get: () =>
    formulario.subcategoria_id === null ? SIN_SUBCATEGORIA : String(formulario.subcategoria_id),
  set: (valor) => {
    formulario.subcategoria_id = valor === SIN_SUBCATEGORIA ? null : Number(valor)
  },
})

const subcategoriasDeLaCategoria = computed(() => {
  const categoria = tiendaCategorias.categorias.find(
    (c) => c.categoria.id === formulario.categoria_id,
  )
  return categoria?.subcategorias ?? []
})

// Filtros avanzados de la barra de búsqueda (independientes del formulario
// de alta/edición): fecha desde/hasta, categoría, subcategoría, e importe y
// saldo por rango. '' en fecha/importe/saldo significa "sin límite".
const fechaDesde = ref('')
const fechaHasta = ref('')

const importeMin = ref('')
const importeMax = ref('')
const saldoMin = ref('')
const saldoMax = ref('')

// Filtro de categoría/subcategoría con selección múltiple (mismo patrón que
// el filtro de Cuenta): todas marcadas por defecto, sin selección = 0
// resultados. La subcategoría "(sin subcategoría)" no tiene id real en el
// dominio; se representa con este identificador negativo, que nunca
// coincide con un id de subcategoría real (siempre positivos).
const SIN_SUBCATEGORIA_FILTRO_ID = -1

const categoriasFiltro = ref<number[]>([])
const subcategoriasFiltro = ref<number[]>([])

const itemsCategoriasFiltro = computed(() =>
  tiendaCategorias.categorias.map((c) => ({ id: c.categoria.id, nombre: c.categoria.nombre })),
)

// Subcategorías de las categorías actualmente marcadas en el filtro (todas,
// si están todas marcadas), más la opción "(sin subcategoría)".
const itemsSubcategoriasFiltro = computed(() => {
  const subcategorias = tiendaCategorias.categorias
    .filter((c) => categoriasFiltro.value.includes(c.categoria.id))
    .flatMap((c) => c.subcategorias)
    .map((s) => ({ id: s.id, nombre: s.nombre }))
  return [...subcategorias, { id: SIN_SUBCATEGORIA_FILTRO_ID, nombre: '(sin subcategoría)' }]
})

// Al cambiar las categorías marcadas, las subcategorías disponibles cambian:
// se resetea la selección a "todas las nuevas disponibles" (si se dejara la
// selección anterior, podría referirse a subcategorías de una categoría ya
// desmarcada).
watch(itemsSubcategoriasFiltro, (items) => {
  subcategoriasFiltro.value = items.map((i) => i.id)
})

function nombreCuenta(idCuenta: number): string {
  const cuenta = tiendaCuentas.cuentas.find((c) => c.id === idCuenta)
  return cuenta ? (cuenta.alias ?? cuenta.numero_cuenta) : ''
}

const itemsCuentasFiltro = computed(() =>
  tiendaCuentas.cuentas.map((c) => ({ id: c.id, nombre: c.alias ?? c.numero_cuenta })),
)

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

function compararTexto(a: string, b: string): number {
  return a.localeCompare(b)
}

const filasConFiltrosAvanzados = computed(() =>
  tiendaMovimientos.movimientos.filter((m) => {
    if (fechaDesde.value && m.fecha_valor < fechaDesde.value) return false
    if (fechaHasta.value && m.fecha_valor > fechaHasta.value) return false
    if (!categoriasFiltro.value.includes(m.categoria_id)) return false
    const claveSubcategoria = m.subcategoria_id ?? SIN_SUBCATEGORIA_FILTRO_ID
    if (!subcategoriasFiltro.value.includes(claveSubcategoria)) return false
    if (importeMin.value !== '' && Number(m.importe) < Number(importeMin.value)) return false
    if (importeMax.value !== '' && Number(m.importe) > Number(importeMax.value)) return false
    if (saldoMin.value !== '' && Number(m.saldo) < Number(saldoMin.value)) return false
    if (saldoMax.value !== '' && Number(m.saldo) > Number(saldoMax.value)) return false
    return true
  }),
)

const { busqueda, filasFiltradas } = useBusquedaTabla(filasConFiltrosAvanzados, (m) => [
  formatearFecha(m.fecha_valor),
  nombreCuenta(m.cuenta_id),
  m.descripcion,
  nombreCategoria(m.categoria_id),
  nombreSubcategoria(m.subcategoria_id),
  m.importe,
  m.saldo,
])

function limpiarFiltros(): void {
  busqueda.value = ''
  fechaDesde.value = ''
  fechaHasta.value = ''
  categoriasFiltro.value = itemsCategoriasFiltro.value.map((i) => i.id)
  subcategoriasFiltro.value = itemsSubcategoriasFiltro.value.map((i) => i.id)
  importeMin.value = ''
  importeMax.value = ''
  saldoMin.value = ''
  saldoMax.value = ''
}

const filtrosAbiertos = ref(true)
const graficosAbiertos = ref(true)
const resultadosAbiertos = ref(true)

// Resumen de gastos e ingresos (sobre las filas ya filtradas, antes de
// ordenar/paginar), igual que en VistaHistorialGastos.vue pero separando
// por signo del importe en vez de estar ya restringido a "gastos".
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

const MAXIMO_TOP_CATEGORIAS = 10

// Top 10 categorías con mayor importe acumulado (sobre las mismas filas ya
// filtradas que el resto de la zona de Gráficos), para el desglose que
// acompaña al comparativo de gastos vs ingresos.
function topCategoriasDe(movimientos: Movimiento[]): TotalCategoria[] {
  const totalesPorCategoria = new Map<number, number>()
  for (const m of movimientos) {
    totalesPorCategoria.set(
      m.categoria_id,
      (totalesPorCategoria.get(m.categoria_id) ?? 0) + Number(m.importe),
    )
  }
  return [...totalesPorCategoria.entries()]
    .map(([idCategoria, total]) => ({
      categoria_id: idCategoria,
      nombre: nombreCategoria(idCategoria),
      total: String(total),
    }))
    .sort((a, b) => Math.abs(Number(b.total)) - Math.abs(Number(a.total)))
    .slice(0, MAXIMO_TOP_CATEGORIAS)
}

const topCategoriasGastos = computed(() => topCategoriasDe(movimientosGastados.value))
const topCategoriasIngresos = computed(() => topCategoriasDe(movimientosIngresados.value))

// Movimientos que componen el total de cada categoría, ordenados de mayor a
// menor importe (en valor absoluto). Alimenta el title y la modal "Detalles"
// de cada categoría del top 10 (ver ListaTotalesCategoria).
function movimientosPorCategoriaDe(
  movimientos: Movimiento[],
): Record<number, MovimientoDeCategoria[]> {
  const porCategoria = new Map<number, Movimiento[]>()
  for (const m of movimientos) {
    const lista = porCategoria.get(m.categoria_id) ?? []
    lista.push(m)
    porCategoria.set(m.categoria_id, lista)
  }

  const resultado: Record<number, MovimientoDeCategoria[]> = {}
  for (const [idCategoria, lista] of porCategoria) {
    resultado[idCategoria] = [...lista]
      .sort((a, b) => Math.abs(Number(b.importe)) - Math.abs(Number(a.importe)))
      .map((m) => ({
        fecha: m.fecha_valor,
        descripcion: m.descripcion,
        subcategoria: nombreSubcategoria(m.subcategoria_id),
        importe: m.importe,
      }))
  }
  return resultado
}

const movimientosPorTopCategoriaGastos = computed(() =>
  movimientosPorCategoriaDe(movimientosGastados.value),
)
const movimientosPorTopCategoriaIngresos = computed(() =>
  movimientosPorCategoriaDe(movimientosIngresados.value),
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

const COLUMNAS_TABLA = [
  'Cuenta',
  'Fecha',
  'Descripción',
  'Categoría',
  'Subcategoría',
  'Importe',
  'Saldo',
]

// Exporta todas las filas filtradas/ordenadas (no solo la página actual),
// que es lo que un usuario espera de "exportar esta tabla".
const filasTablaParaExportar = computed(() =>
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

// Al cambiar cualquier filtro se vuelve a la página 1 para ver los
// resultados desde el principio.
watch(
  [
    busqueda,
    fechaDesde,
    fechaHasta,
    categoriasFiltro,
    subcategoriasFiltro,
    importeMin,
    importeMax,
    saldoMin,
    saldoMax,
  ],
  () => {
    paginaActual.value = 1
  },
  { deep: true },
)

const todosSeleccionados = computed(
  () =>
    filasOrdenadas.value.length > 0 &&
    filasOrdenadas.value.every((m) => seleccionados.value.has(m.id)),
)

onMounted(async () => {
  await Promise.all([tiendaCuentas.cargar(), tiendaCategorias.cargar()])

  // Si se llega desde "Ver movimientos" tras una importación, se preselecciona
  // solo la cuenta indicada en la URL; si no, todas las cuentas por defecto.
  const idDesdeUrl = Number(ruta.query.cuenta_id)
  const cuentaDesdeUrl = tiendaCuentas.cuentas.find((c) => c.id === idDesdeUrl)
  cuentasSeleccionadas.value = cuentaDesdeUrl
    ? [cuentaDesdeUrl.id]
    : tiendaCuentas.cuentas.map((c) => c.id)

  categoriasFiltro.value = itemsCategoriasFiltro.value.map((i) => i.id)
  subcategoriasFiltro.value = itemsSubcategoriasFiltro.value.map((i) => i.id)
})

// Marcar/desmarcar varias cuentas seguidas en el popover (p. ej. "Seleccionar
// todas") dispara un cambio de `cuentasSeleccionadas` por cada casilla; se
// espera un instante sin más cambios antes de recargar, para no lanzar una
// petición por cuenta y por click en vez de una sola con la selección final.
let temporizadorRecarga: ReturnType<typeof setTimeout> | undefined
watch(
  cuentasSeleccionadas,
  (ids) => {
    seleccionados.value = new Set()
    clearTimeout(temporizadorRecarga)
    temporizadorRecarga = setTimeout(() => tiendaMovimientos.cargarVarias(ids), 150)
  },
  { deep: true },
)

function limpiarFormulario(): void {
  formulario.cuenta_id = 0
  formulario.categoria_id = 0
  formulario.subcategoria_id = null
  formulario.fecha_valor = ''
  formulario.descripcion = ''
  formulario.comentario = ''
  formulario.importe = ''
  formulario.saldo = ''
  idEnEdicion.value = null
}

function abrirParaCrear(): void {
  limpiarFormulario()
  formulario.cuenta_id = cuentasSeleccionadas.value[0] ?? 0
  panelAbierto.value = true
}

function abrirParaEditar(movimiento: Movimiento): void {
  idEnEdicion.value = movimiento.id
  formulario.cuenta_id = movimiento.cuenta_id
  formulario.categoria_id = movimiento.categoria_id
  formulario.subcategoria_id = movimiento.subcategoria_id
  formulario.fecha_valor = movimiento.fecha_valor
  formulario.descripcion = movimiento.descripcion
  formulario.comentario = movimiento.comentario ?? ''
  formulario.importe = movimiento.importe
  formulario.saldo = movimiento.saldo
  panelAbierto.value = true
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
    panelAbierto.value = false
    limpiarFormulario()
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

async function eliminar(id: number): Promise<void> {
  error.value = null
  try {
    await tiendaMovimientos.eliminar(id)
    seleccionados.value.delete(id)
  } catch (motivo) {
    error.value = (motivo as Error).message
  }
}

async function eliminarSeleccionados(): Promise<void> {
  error.value = null
  const idsSeleccionados = [...seleccionados.value]
  const resultados = await Promise.allSettled(
    idsSeleccionados.map((id) => tiendaMovimientos.eliminar(id)),
  )
  // Se recarga siempre desde el servidor al terminar, aunque haya fallado
  // algún borrado: con Promise.all, un único fallo abortaba el resto sin
  // volver a sincronizar, dejando la tabla desajustada respecto al backend
  // aunque otros movimientos sí se hubieran borrado.
  await tiendaMovimientos.cargarVarias(cuentasSeleccionadas.value)
  seleccionados.value = new Set()
  const fallidos = resultados.filter((r) => r.status === 'rejected')
  if (fallidos.length > 0) {
    error.value = `No se pudieron eliminar ${fallidos.length} de ${idsSeleccionados.length} movimientos seleccionados.`
  }
}

function alternarSeleccionTodos(marcado: boolean): void {
  seleccionados.value = marcado ? new Set(filasOrdenadas.value.map((m) => m.id)) : new Set()
}

function alternarSeleccion(id: number, marcado: boolean): void {
  const nuevaSeleccion = new Set(seleccionados.value)
  if (marcado) nuevaSeleccion.add(id)
  else nuevaSeleccion.delete(id)
  seleccionados.value = nuevaSeleccion
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Movimientos</h2>
      <Button variant="success" @click="abrirParaCrear">Crear movimiento</Button>
    </div>

    <Sheet v-model:open="panelAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{{
            idEnEdicion === null ? 'Crear movimiento' : 'Editar movimiento'
          }}</SheetTitle>
        </SheetHeader>

        <form class="flex flex-col gap-3 px-4" @submit.prevent="guardar">
          <div class="flex flex-col gap-1.5">
            <Label id="etiqueta-cuenta-formulario" for="selector-cuenta-formulario">Cuenta</Label>
            <Select v-model="cuentaFormularioTexto">
              <SelectTrigger
                id="selector-cuenta-formulario"
                aria-labelledby="etiqueta-cuenta-formulario"
              >
                <SelectValue placeholder="Selecciona una cuenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="cuenta in tiendaCuentas.cuentas"
                  :key="cuenta.id"
                  :value="String(cuenta.id)"
                >
                  {{ cuenta.alias ?? cuenta.numero_cuenta }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label for="fecha-valor">Fecha</Label>
            <Input id="fecha-valor" v-model="formulario.fecha_valor" type="date" required />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label id="etiqueta-categoria" for="selector-categoria">Categoría</Label>
            <Select v-model="categoriaSeleccionadaTexto">
              <SelectTrigger id="selector-categoria" aria-labelledby="etiqueta-categoria">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="c in tiendaCategorias.categorias"
                  :key="c.categoria.id"
                  :value="String(c.categoria.id)"
                >
                  {{ c.categoria.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label id="etiqueta-subcategoria" for="selector-subcategoria">Subcategoría</Label>
            <Select v-model="subcategoriaSeleccionadaTexto">
              <SelectTrigger id="selector-subcategoria" aria-labelledby="etiqueta-subcategoria">
                <SelectValue placeholder="(sin subcategoría)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</SelectItem>
                <SelectItem
                  v-for="s in subcategoriasDeLaCategoria"
                  :key="s.id"
                  :value="String(s.id)"
                >
                  {{ s.nombre }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label for="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              v-model="formulario.descripcion"
              placeholder="Descripción"
              required
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="comentario">Comentario</Label>
            <Input id="comentario" v-model="formulario.comentario" placeholder="Comentario" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="importe">Importe</Label>
            <Input id="importe" v-model="formulario.importe" placeholder="Importe" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="saldo">Saldo</Label>
            <Input id="saldo" v-model="formulario.saldo" placeholder="Saldo" required />
          </div>

          <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>

          <div class="flex gap-2">
            <Button type="submit" variant="success">
              {{ idEnEdicion === null ? 'Crear movimiento' : 'Guardar cambios' }}
            </Button>
            <Button type="button" variant="destructive" @click="panelAbierto = false"
              >Cancelar</Button
            >
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <div
      v-if="seleccionados.size > 0"
      class="mt-4 flex items-center gap-3 rounded-lg border p-2 text-sm"
    >
      <span>{{ seleccionados.size }} seleccionados</span>
      <DialogoConfirmarEliminacion
        :descripcion="`${seleccionados.size} movimientos seleccionados`"
        texto-boton="Eliminar seleccionados"
        @confirmar="eliminarSeleccionados"
      />
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
          <div class="flex flex-col gap-1.5">
            <Label>Cuenta</Label>
            <FiltroMultiple
              v-model="cuentasSeleccionadas"
              :items="itemsCuentasFiltro"
              id-base="filtro-cuenta"
              etiqueta-boton="Filtrar por cuenta"
              nombre-singular="cuenta"
              nombre-plural="cuentas"
            />
          </div>

          <div class="flex max-w-xs flex-col gap-1.5">
            <Label for="buscar-movimientos">Buscar</Label>
            <div class="relative">
              <Search
                class="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4"
              />
              <Input
                id="buscar-movimientos"
                v-model="busqueda"
                placeholder="Buscar movimientos…"
                class="pl-8"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label for="filtro-fecha-desde">Fecha desde</Label>
            <Input id="filtro-fecha-desde" v-model="fechaDesde" type="date" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="filtro-fecha-hasta">Fecha hasta</Label>
            <Input id="filtro-fecha-hasta" v-model="fechaHasta" type="date" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Filtrar por categoría</Label>
            <FiltroMultiple
              v-model="categoriasFiltro"
              :items="itemsCategoriasFiltro"
              id-base="filtro-categoria"
              etiqueta-boton="Filtrar por categoría"
              nombre-singular="categoría"
              nombre-plural="categorías"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Filtrar por subcategoría</Label>
            <FiltroMultiple
              v-model="subcategoriasFiltro"
              :items="itemsSubcategoriasFiltro"
              id-base="filtro-subcategoria"
              etiqueta-boton="Filtrar por subcategoría"
              nombre-singular="subcategoría"
              nombre-plural="subcategorías"
            />
          </div>

          <FiltroRangoNumero
            label="Importe"
            id-base="filtro-importe"
            v-model:min="importeMin"
            v-model:max="importeMax"
          />
          <FiltroRangoNumero
            label="Saldo"
            id-base="filtro-saldo"
            v-model:min="saldoMin"
            v-model:max="saldoMax"
          />

          <Button type="button" variant="outline" @click="limpiarFiltros">Limpiar filtros</Button>
        </CollapsibleContent>
      </Collapsible>
    </div>

    <div
      v-if="movimientosGastados.length > 0 || movimientosIngresados.length > 0"
      class="bg-muted/40 mt-4 flex flex-col gap-4 rounded-lg border p-4"
    >
      <Collapsible v-model:open="graficosAbiertos">
        <CollapsibleTrigger
          class="text-muted-foreground flex items-center gap-1 text-sm font-medium"
          :aria-label="graficosAbiertos ? 'Contraer gráficos' : 'Expandir gráficos'"
        >
          <ChevronRight
            class="size-4 transition-transform"
            :class="graficosAbiertos ? 'rotate-90' : ''"
          />
          Gráficos
        </CollapsibleTrigger>
        <CollapsibleContent class="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  <CardTitle class="text-muted-foreground text-sm font-medium"
                    >Movimientos</CardTitle
                  >
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
                  <CardTitle class="text-muted-foreground text-sm font-medium"
                    >Movimientos</CardTitle
                  >
                </CardHeader>
                <CardContent class="text-2xl font-semibold">
                  {{ movimientosIngresados.length }}
                </CardContent>
              </Card>
            </div>
            <h3 class="text-muted-foreground mt-4 text-sm font-medium">Evolución de ingresos</h3>
            <GraficoEvolucion :items="datosGraficoIngresos" acento="ingreso" class="mt-3" />
          </div>

          <div
            v-if="movimientosGastados.length > 0 && movimientosIngresados.length > 0"
            class="lg:col-span-2"
          >
            <h3 class="text-muted-foreground text-sm font-medium">
              Evolución de gastos vs ingresos
            </h3>
            <GraficoComparativoEvolucion
              :items-gastos="datosGraficoGastos"
              :items-ingresos="datosGraficoIngresos"
              class="mt-3"
            />

            <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ListaTotalesCategoria
                titulo="Top 10 gastos por categoría"
                :items="topCategoriasGastos"
                acento="gasto"
                mensaje-vacio="No hay gastos en el periodo mostrado."
                :movimientos-por-categoria="movimientosPorTopCategoriaGastos"
              />
              <ListaTotalesCategoria
                titulo="Top 10 ingresos por categoría"
                :items="topCategoriasIngresos"
                acento="ingreso"
                mensaje-vacio="No hay ingresos en el periodo mostrado."
                :movimientos-por-categoria="movimientosPorTopCategoriaIngresos"
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
            <SelectorTamanoPagina v-model="tamanoPagina" id-base="movimientos" />
            <div class="flex items-center gap-3">
              <p class="text-muted-foreground text-sm">
                Mostrando {{ primerIndice }}–{{ ultimoIndice }} de {{ totalRegistros }} movimientos
              </p>
              <BotonesExportarTabla
                nombre-fichero="Movimientos"
                titulo="Movimientos"
                :columnas="COLUMNAS_TABLA"
                :filas="filasTablaParaExportar"
              />
            </div>
          </div>

          <Table class="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead class="w-8">
                  <Checkbox
                    :model-value="todosSeleccionados"
                    aria-label="Seleccionar todos los movimientos"
                    @update:model-value="(valor) => alternarSeleccionTodos(valor === true)"
                  />
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="movimiento in filasPagina"
                :key="movimiento.id"
                :class="claseFondoImporte(movimiento.importe)"
              >
                <TableCell>
                  <Checkbox
                    :model-value="seleccionados.has(movimiento.id)"
                    :aria-label="`Seleccionar el movimiento ${movimiento.descripcion}`"
                    @update:model-value="
                      (valor) => alternarSeleccion(movimiento.id, valor === true)
                    "
                  />
                </TableCell>
                <TableCell>{{ nombreCuenta(movimiento.cuenta_id) }}</TableCell>
                <TableCell>{{ formatearFecha(movimiento.fecha_valor) }}</TableCell>
                <TableCell>{{ movimiento.descripcion }}</TableCell>
                <TableCell>{{ nombreCategoria(movimiento.categoria_id) }}</TableCell>
                <TableCell>{{ nombreSubcategoria(movimiento.subcategoria_id) }}</TableCell>
                <TableCell>{{ formatearImporte(movimiento.importe) }}</TableCell>
                <TableCell>{{ formatearImporte(movimiento.saldo) }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar"
                    @click="abrirParaEditar(movimiento)"
                  >
                    <Pencil class="size-4" />
                  </Button>
                  <DialogoConfirmarEliminacion
                    :descripcion="`el movimiento ${movimiento.descripcion}`"
                    @confirmar="eliminar(movimiento.id)"
                  >
                    <template #disparador>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="text-destructive"
                        aria-label="Eliminar"
                      >
                        <Trash2 class="size-4" />
                      </Button>
                    </template>
                  </DialogoConfirmarEliminacion>
                </TableCell>
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  </section>
</template>
