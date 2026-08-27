<script setup lang="ts">
import { ChevronRight, Coins, Hash, Landmark, Pencil, Search, Tag, Trash2, User } from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { CuentaBancaria, DatosCuenta, Movimiento } from '@/api/tipos'
import { aTextoOULlo } from '@/api/utilidades'
import { useBusquedaTabla } from '@/composables/useBusquedaTabla'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import { usePaginacionTabla, type TamanoPagina } from '@/composables/usePaginacionTabla'
import { useProgresoTareas } from '@/composables/useProgresoTareas'
import { formatearFecha, formatearImporte } from '@/lib/formato'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import BarraPaginacion from '@/componentes/compartido/BarraPaginacion.vue'
import BotonesExportarTabla from '@/componentes/compartido/BotonesExportarTabla.vue'
import CabeceraOrdenable from '@/componentes/compartido/CabeceraOrdenable.vue'
import ModalProgresoBloqueante from '@/componentes/compartido/ModalProgresoBloqueante.vue'
import SelectorTamanoPagina from '@/componentes/compartido/SelectorTamanoPagina.vue'
import { Button } from '@/componentes/ui/button'
import { Checkbox } from '@/componentes/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/componentes/ui/collapsible'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/componentes/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'
import DialogoConfirmarEliminacion, {
  type Dependencia,
} from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'

const tienda = useTiendaCuentas()
const tiendaCategorias = useTiendaCategorias()
const errorFormulario = ref<string | null>(null)
const errorEliminacion = ref<string | null>(null)
const idEnEdicion = ref<number | null>(null)
const panelAbierto = ref(false)
const seleccionadas = ref<Set<number>>(new Set())
const filtrosAbiertos = ref(true)
const resultadosAbiertos = ref(true)
const progresoEliminacion = useProgresoTareas()

const formulario = reactive<DatosCuenta>({
  numero_cuenta: '',
  alias: '',
  entidad_bancaria: '',
  moneda: '',
  titular: '',
})

const { busqueda, filasFiltradas } = useBusquedaTabla(
  computed(() => tienda.cuentas),
  (c) => [c.numero_cuenta, c.alias, c.entidad_bancaria, c.moneda, c.titular],
)

function compararTexto(a: string | null, b: string | null): number {
  return (a ?? '').localeCompare(b ?? '')
}

const { campo, direccion, ordenarPor, filasOrdenadas } = useOrdenacionTabla(filasFiltradas, {
  numero_cuenta: (a: CuentaBancaria, b: CuentaBancaria) =>
    compararTexto(a.numero_cuenta, b.numero_cuenta),
  alias: (a: CuentaBancaria, b: CuentaBancaria) => compararTexto(a.alias, b.alias),
  entidad_bancaria: (a: CuentaBancaria, b: CuentaBancaria) =>
    compararTexto(a.entidad_bancaria, b.entidad_bancaria),
  moneda: (a: CuentaBancaria, b: CuentaBancaria) => compararTexto(a.moneda, b.moneda),
  titular: (a: CuentaBancaria, b: CuentaBancaria) => compararTexto(a.titular, b.titular),
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

const COLUMNAS_TABLA = ['Número de cuenta', 'Alias', 'Entidad', 'Moneda', 'Titular']

// Exporta todas las filas filtradas/ordenadas (no solo la página actual),
// que es lo que un usuario espera de "exportar esta tabla".
const filasTablaParaExportar = computed(() =>
  filasOrdenadas.value.map((c) => [
    c.numero_cuenta,
    c.alias ?? '',
    c.entidad_bancaria ?? '',
    c.moneda ?? '',
    c.titular ?? '',
  ]),
)

const todasSeleccionadas = computed(
  () =>
    filasOrdenadas.value.length > 0 &&
    filasOrdenadas.value.every((c) => seleccionadas.value.has(c.id)),
)

onMounted(() => {
  tienda.cargar()
  tiendaCategorias.cargar()
})

function limpiarFormulario(): void {
  formulario.numero_cuenta = ''
  formulario.alias = ''
  formulario.entidad_bancaria = ''
  formulario.moneda = ''
  formulario.titular = ''
  idEnEdicion.value = null
}

function abrirParaCrear(): void {
  limpiarFormulario()
  panelAbierto.value = true
}

function abrirParaEditar(cuenta: CuentaBancaria): void {
  idEnEdicion.value = cuenta.id
  formulario.numero_cuenta = cuenta.numero_cuenta
  formulario.alias = cuenta.alias ?? ''
  formulario.entidad_bancaria = cuenta.entidad_bancaria ?? ''
  formulario.moneda = cuenta.moneda ?? ''
  formulario.titular = cuenta.titular ?? ''
  panelAbierto.value = true
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
      // Las cuentas nuevas se añaden al final de la lista: se salta a la
      // última página para que la recién creada quede visible.
      paginaActual.value = totalPaginas.value
    } else {
      await tienda.actualizar(idEnEdicion.value, datos)
    }
    panelAbierto.value = false
    limpiarFormulario()
  } catch (motivo) {
    errorFormulario.value = (motivo as Error).message
  }
}

function etiquetaMovimientos(cantidad: number): string {
  return cantidad === 1 ? 'movimiento' : 'movimientos'
}

async function dependenciasDeCuenta(id: number): Promise<Dependencia[]> {
  const dependencias = await tienda.obtenerDependencias(id)
  return [
    { etiqueta: etiquetaMovimientos(dependencias.movimientos), cantidad: dependencias.movimientos },
  ]
}

async function dependenciasDeSeleccionadas(): Promise<Dependencia[]> {
  const resultados = await Promise.all(
    [...seleccionadas.value].map((id) => tienda.obtenerDependencias(id)),
  )
  const total = resultados.reduce((suma, d) => suma + d.movimientos, 0)
  return [{ etiqueta: etiquetaMovimientos(total), cantidad: total }]
}

function nombreCuentaPorId(id: number): string {
  const cuenta = tienda.cuentas.find((c) => c.id === id)
  return cuenta ? (cuenta.alias ?? cuenta.numero_cuenta) : ''
}

function nombreCategoriaPorId(id: number): string {
  return tiendaCategorias.categorias.find((c) => c.categoria.id === id)?.categoria.nombre ?? ''
}

function nombreSubcategoriaPorId(id: number | null): string {
  if (id === null) return ''
  for (const c of tiendaCategorias.categorias) {
    const sub = c.subcategorias.find((s) => s.id === id)
    if (sub) return sub.nombre
  }
  return ''
}

const COLUMNAS_DETALLES_MOVIMIENTOS = [
  'Fecha',
  'Cuenta',
  'Categoría',
  'Subcategoría',
  'Descripción',
  'Importe',
  'Saldo',
]

function filasDetalleDeMovimientos(movimientos: Movimiento[]): (string | number)[][] {
  return movimientos.map((m) => [
    formatearFecha(m.fecha_valor),
    nombreCuentaPorId(m.cuenta_id),
    nombreCategoriaPorId(m.categoria_id),
    nombreSubcategoriaPorId(m.subcategoria_id),
    m.descripcion,
    formatearImporte(m.importe),
    formatearImporte(m.saldo),
  ])
}

// Se consulta directamente vía clienteApi (no a través del store de
// movimientos) para no pisar el estado global de `movimientos`, que otras
// vistas usan para su propio listado.
async function movimientosDeCuenta(id: number): Promise<Movimiento[]> {
  return clienteApi.obtener<Movimiento[]>(`/movimientos?cuenta_id=${id}`)
}

async function filasDetalleDeCuenta(id: number): Promise<(string | number)[][]> {
  return filasDetalleDeMovimientos(await movimientosDeCuenta(id))
}

async function filasDetalleDeSeleccionadas(): Promise<(string | number)[][]> {
  const resultados = await Promise.all(
    [...seleccionadas.value].map((id) => movimientosDeCuenta(id)),
  )
  return filasDetalleDeMovimientos(resultados.flat())
}

async function eliminar(id: number, cascada = false): Promise<void> {
  errorEliminacion.value = null
  try {
    await tienda.eliminar(id, cascada)
    seleccionadas.value.delete(id)
  } catch (motivo) {
    errorEliminacion.value = (motivo as Error).message
  }
}

async function eliminarSeleccionadas(cascada = false): Promise<void> {
  errorEliminacion.value = null
  const ids = [...seleccionadas.value]
  // Los nombres se capturan antes de borrar: las cuentas eliminadas con
  // éxito desaparecen de la tienda, y el mensaje de error debe poder seguir
  // identificando cuáles fallaron aunque eso ya haya pasado.
  const nombrePorId = new Map(ids.map((id) => [id, nombreCuentaPorId(id) || `#${id}`]))
  try {
    const tareas = progresoEliminacion.envolver(ids.map((id) => () => tienda.eliminar(id, cascada)))
    const resultados = await Promise.allSettled(tareas.map((tarea) => tarea()))

    const fallidas: string[] = []
    resultados.forEach((resultado, indice) => {
      const id = ids[indice]
      if (id === undefined) return
      if (resultado.status === 'fulfilled') {
        seleccionadas.value.delete(id)
      } else {
        fallidas.push(`${nombrePorId.get(id)} (${(resultado.reason as Error).message})`)
      }
    })

    if (fallidas.length > 0) {
      errorEliminacion.value = `No se pudieron eliminar ${fallidas.length} de ${ids.length} cuentas: ${fallidas.join(', ')}`
    }
  } finally {
    progresoEliminacion.terminar()
  }
}

function alternarSeleccionTodas(marcado: boolean): void {
  seleccionadas.value = marcado ? new Set(filasOrdenadas.value.map((c) => c.id)) : new Set()
}

function alternarSeleccion(id: number, marcado: boolean): void {
  const nuevaSeleccion = new Set(seleccionadas.value)
  if (marcado) nuevaSeleccion.add(id)
  else nuevaSeleccion.delete(id)
  seleccionadas.value = nuevaSeleccion
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">Cuentas bancarias</h2>
      <Button variant="success" @click="abrirParaCrear">Crear cuenta</Button>
    </div>

    <ModalProgresoBloqueante
      v-if="progresoEliminacion.enCurso.value"
      titulo="Eliminando cuentas"
      etiqueta-unidad="cuentas"
      :progreso="{
        procesadas: progresoEliminacion.procesadas.value,
        total: progresoEliminacion.total.value,
      }"
    />

    <Sheet v-model:open="panelAbierto">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{{ idEnEdicion === null ? 'Crear cuenta' : 'Editar cuenta' }}</SheetTitle>
        </SheetHeader>

        <form class="flex flex-col gap-3 px-4" @submit.prevent="guardar">
          <div class="flex flex-col gap-1.5">
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

          <p v-if="errorFormulario" class="text-sm text-destructive" role="alert">
            {{ errorFormulario }}
          </p>

          <div class="flex gap-2">
            <Button type="submit" variant="success">
              {{ idEnEdicion === null ? 'Crear cuenta' : 'Guardar cambios' }}
            </Button>
            <Button type="button" variant="destructive" @click="panelAbierto = false"
              >Cancelar</Button
            >
          </div>
        </form>
      </SheetContent>
    </Sheet>

    <p v-if="tienda.error" class="mt-2 text-sm text-destructive" role="alert">{{ tienda.error }}</p>
    <p v-if="errorEliminacion" class="mt-2 text-sm text-destructive" role="alert">
      {{ errorEliminacion }}
    </p>

    <div
      v-if="seleccionadas.size > 0"
      class="mt-4 flex items-center gap-3 rounded-lg border p-2 text-sm"
    >
      <span>{{ seleccionadas.size }} seleccionados</span>
      <DialogoConfirmarEliminacion
        :descripcion="`${seleccionadas.size} cuentas seleccionadas`"
        texto-boton="Eliminar seleccionados"
        disparador-solido
        :obtener-dependencias="dependenciasDeSeleccionadas"
        titulo-detalles="Movimientos que se eliminarán"
        :columnas-detalles="COLUMNAS_DETALLES_MOVIMIENTOS"
        :obtener-filas-detalles="filasDetalleDeSeleccionadas"
        @confirmar="(cascada) => eliminarSeleccionadas(cascada)"
      />
    </div>

    <div class="bg-muted/40 mt-6 flex flex-col gap-4 rounded-lg border p-4">
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
          <div class="flex max-w-xs flex-col gap-1.5">
            <Label for="buscar-cuentas">Buscar</Label>
            <div class="relative">
              <Search
                class="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4"
              />
              <Input
                id="buscar-cuentas"
                v-model="busqueda"
                placeholder="Buscar cuentas…"
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
            <SelectorTamanoPagina v-model="tamanoPagina" id-base="cuentas" />
            <div class="flex items-center gap-3">
              <p class="text-muted-foreground text-sm">
                Mostrando {{ primerIndice }}–{{ ultimoIndice }} de {{ totalRegistros }} cuentas
              </p>
              <BotonesExportarTabla
                nombre-fichero="Cuentas"
                titulo="Cuentas bancarias"
                :columnas="COLUMNAS_TABLA"
                :filas="filasTablaParaExportar"
              />
            </div>
          </div>

          <Table class="mt-4 table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead class="w-9">
                  <Checkbox
                    :model-value="todasSeleccionadas"
                    aria-label="Seleccionar todas las cuentas"
                    @update:model-value="(valor) => alternarSeleccionTodas(valor === true)"
                  />
                </TableHead>
                <TableHead class="w-[28%] whitespace-normal">
                  <CabeceraOrdenable
                    :icono="Hash"
                    color-icono="text-blue-500"
                    :activo="campo === 'numero_cuenta'"
                    :direccion="direccion"
                    @ordenar="ordenarPor('numero_cuenta')"
                    >Número de cuenta</CabeceraOrdenable
                  >
                </TableHead>
                <TableHead class="w-[15%] whitespace-normal">
                  <CabeceraOrdenable
                    :icono="Tag"
                    color-icono="text-violet-500"
                    :activo="campo === 'alias'"
                    :direccion="direccion"
                    @ordenar="ordenarPor('alias')"
                    >Alias</CabeceraOrdenable
                  >
                </TableHead>
                <TableHead class="w-[17%] whitespace-normal">
                  <CabeceraOrdenable
                    :icono="Landmark"
                    color-icono="text-amber-500"
                    :activo="campo === 'entidad_bancaria'"
                    :direccion="direccion"
                    @ordenar="ordenarPor('entidad_bancaria')"
                    >Entidad</CabeceraOrdenable
                  >
                </TableHead>
                <TableHead class="w-[10%] whitespace-normal">
                  <CabeceraOrdenable
                    :icono="Coins"
                    color-icono="text-teal-500"
                    :activo="campo === 'moneda'"
                    :direccion="direccion"
                    @ordenar="ordenarPor('moneda')"
                    >Moneda</CabeceraOrdenable
                  >
                </TableHead>
                <TableHead class="w-[22%] whitespace-normal">
                  <CabeceraOrdenable
                    :icono="User"
                    color-icono="text-rose-500"
                    :activo="campo === 'titular'"
                    :direccion="direccion"
                    @ordenar="ordenarPor('titular')"
                    >Titular</CabeceraOrdenable
                  >
                </TableHead>
                <TableHead class="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="cuenta in filasPagina" :key="cuenta.id">
                <TableCell>
                  <Checkbox
                    :model-value="seleccionadas.has(cuenta.id)"
                    :aria-label="`Seleccionar la cuenta ${cuenta.numero_cuenta}`"
                    @update:model-value="(valor) => alternarSeleccion(cuenta.id, valor === true)"
                  />
                </TableCell>
                <TableCell class="truncate" :title="cuenta.numero_cuenta">{{
                  cuenta.numero_cuenta
                }}</TableCell>
                <TableCell class="truncate" :title="cuenta.alias ?? ''">{{
                  cuenta.alias
                }}</TableCell>
                <TableCell class="truncate" :title="cuenta.entidad_bancaria ?? ''">{{
                  cuenta.entidad_bancaria
                }}</TableCell>
                <TableCell class="truncate" :title="cuenta.moneda ?? ''">{{
                  cuenta.moneda
                }}</TableCell>
                <TableCell class="truncate" :title="cuenta.titular ?? ''">{{
                  cuenta.titular
                }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar"
                    @click="abrirParaEditar(cuenta)"
                  >
                    <Pencil class="size-4" />
                  </Button>
                  <DialogoConfirmarEliminacion
                    :descripcion="`la cuenta ${cuenta.numero_cuenta}`"
                    :obtener-dependencias="() => dependenciasDeCuenta(cuenta.id)"
                    titulo-detalles="Movimientos que se eliminarán"
                    :columnas-detalles="COLUMNAS_DETALLES_MOVIMIENTOS"
                    :obtener-filas-detalles="() => filasDetalleDeCuenta(cuenta.id)"
                    @confirmar="(cascada) => eliminar(cuenta.id, cascada)"
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
