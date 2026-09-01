<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, Pencil, RefreshCw, Tag, Trash2 } from '@lucide/vue'
import type { FilaResumenAnual, Movimiento, OrigenValorMensual, Periodicidad } from '@/api/tipos'
import { claseColorImporte, formatearImporte } from '@/lib/formato'
import { useOrdenacionTabla } from '@/composables/useOrdenacionTabla'
import { useTiendaPrevisiones } from '@/stores/previsiones'
import CabeceraOrdenable from '@/componentes/compartido/CabeceraOrdenable.vue'
import DialogoConfirmarEliminacion from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'
import ModalListaMovimientos from '@/componentes/compartido/ModalListaMovimientos.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/componentes/ui/alert-dialog'
import { Badge } from '@/componentes/ui/badge'
import { Button } from '@/componentes/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/componentes/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/componentes/ui/tooltip'

const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

const NOMBRE_PERIODICIDAD: Record<Periodicidad, string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

const COLOR_PERIODICIDAD: Record<Periodicidad, string> = {
  mensual: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  trimestral: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  semestral: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  anual: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
}

const props = withDefaults(
  defineProps<{
    titulo: string
    filas: FilaResumenAnual[]
    totales: string[]
    mensajeVacio: string
    anio: number
    ocultarTitulo?: boolean
  }>(),
  { ocultarTitulo: false },
)

const emit = defineEmits<{
  editar: [conceptoId: number]
  eliminar: [conceptoId: number]
  'editar-celda': [conceptoId: number, mes: number, importe: string | null]
  'cargar-acumulado-real': [conceptoId: number]
}>()

const tiendaPrevisiones = useTiendaPrevisiones()
const detalleMovimientos = ref<Record<string, Movimiento[]>>({})

function claveDetalle(conceptoId: number, mes: number): string {
  return `${conceptoId}-${mes}`
}

async function abrirDetalleMes(conceptoId: number, mes: number): Promise<void> {
  const clave = claveDetalle(conceptoId, mes)
  if (detalleMovimientos.value[clave]) return
  detalleMovimientos.value[clave] = await tiendaPrevisiones.listarMovimientosDeConcepto(
    conceptoId,
    props.anio,
    mes,
  )
}

// ObtenerResumenAnual marca como "real" (con importe 0) los meses en los que
// un concepto no mensual no aplica y tampoco hay movimientos: no hay nada
// que inspeccionar ahí, así que el icono de detalle no debe aparecer.
function mostrarDetalleMes(valor: { origen: OrigenValorMensual; importe: string }): boolean {
  if (valor.origen === 'previsto') return false
  if (valor.origen === 'real' && Number(valor.importe) === 0) return false
  return true
}

// Solo dispara la carga perezosa cuando hay algo que cargar (mismo criterio
// que el icono "Ver movimientos"), para no pedir nada al pasar el ratón por
// una celda prevista.
function alPasarElRatonPorImporte(
  conceptoId: number,
  mes: number,
  valor: { origen: OrigenValorMensual; importe: string },
): void {
  if (!mostrarDetalleMes(valor)) return
  abrirDetalleMes(conceptoId, mes)
}

// Con un único movimiento se muestra su comentario tal cual (caso más
// habitual); con varios, solo los que tengan comentario, cada uno con su
// descripción por delante para no generar ambigüedad sobre a cuál pertenece.
function comentarioCelda(conceptoId: number, mes: number): string {
  const movimientos = detalleMovimientos.value[claveDetalle(conceptoId, mes)]
  if (!movimientos) return ''
  const conComentario = movimientos.filter((m) => m.comentario)
  if (conComentario.length === 0) return ''
  if (movimientos.length === 1) return conComentario[0]!.comentario!
  return conComentario.map((m) => `${m.descripcion}: ${m.comentario}`).join('\n')
}

function saldoAnual(fila: FilaResumenAnual): string {
  return fila.valores.reduce((suma, valor) => suma + Number(valor.importe), 0).toFixed(2)
}

// Solo "Concepto" es un campo realmente ordenable en este listado: los
// meses son columnas fijas en su orden natural (Ene-Dic), no campos por los
// que tenga sentido reordenar filas.
const { campo, direccion, ordenarPor, filasOrdenadas } = useOrdenacionTabla(
  computed(() => props.filas),
  {
    nombre: (a: FilaResumenAnual, b: FilaResumenAnual) => a.nombre.localeCompare(b.nombre),
  },
)

const celdaEditando = ref<{ conceptoId: number; mes: number } | null>(null)
const valorEdicion = ref('')

function estaEditando(conceptoId: number, mes: number): boolean {
  return celdaEditando.value?.conceptoId === conceptoId && celdaEditando.value?.mes === mes
}

function empezarEdicion(conceptoId: number, mes: number, importeActual: string): void {
  celdaEditando.value = { conceptoId, mes }
  valorEdicion.value = importeActual
}

function confirmarEdicion(): void {
  if (!celdaEditando.value) return
  const { conceptoId, mes } = celdaEditando.value
  const texto = valorEdicion.value.trim()
  emit('editar-celda', conceptoId, mes, texto === '' ? null : texto)
  celdaEditando.value = null
}

function cancelarEdicion(): void {
  celdaEditando.value = null
}

// Los valores "previsto" se muestran atenuados a propósito para distinguirlos
// de los confirmados; no se colorean en verde/rojo para no perder ese matiz.
function claseCelda(origen: OrigenValorMensual, importe: string): string {
  const base = 'p-0 text-right tabular-nums'
  if (origen === 'previsto') return `${base} text-muted-foreground italic`
  if (origen === 'ajustado') {
    return `${base} border-b-2 border-dashed border-amber-500 ${claseColorImporte(importe)}`
  }
  return `${base} ${claseColorImporte(importe)}`
}
</script>

<template>
  <section>
    <h3 v-if="!ocultarTitulo" class="text-lg font-semibold">{{ titulo }}</h3>
    <p v-if="filas.length === 0" class="text-muted-foreground mt-2 text-sm">{{ mensajeVacio }}</p>
    <template v-else>
      <p v-if="!ocultarTitulo" class="text-muted-foreground mt-1 text-sm">
        {{ filas.length }} concepto{{ filas.length === 1 ? '' : 's' }}
      </p>
      <div class="mt-2 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <CabeceraOrdenable
                  :icono="Tag"
                  color-icono="text-violet-500"
                  :activo="campo === 'nombre'"
                  :direccion="direccion"
                  @ordenar="ordenarPor('nombre')"
                  >Concepto</CabeceraOrdenable
                >
              </TableHead>
              <TableHead v-for="mes in MESES_CORTOS" :key="mes" class="text-right">{{
                mes
              }}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="fila in filasOrdenadas" :key="fila.concepto_id">
              <TableCell>
                <div class="flex items-center gap-2">
                  <span>{{ fila.nombre }}</span>
                  <Badge :class="COLOR_PERIODICIDAD[fila.periodicidad]" variant="outline">
                    {{ NOMBRE_PERIODICIDAD[fila.periodicidad] }}
                  </Badge>
                  <span
                    class="text-xs tabular-nums whitespace-nowrap"
                    :class="claseColorImporte(saldoAnual(fila)) || 'text-muted-foreground'"
                  >
                    Saldo año {{ anio }}: {{ formatearImporte(saldoAnual(fila)) }}
                  </span>
                </div>
              </TableCell>
              <TableCell
                v-for="valor in fila.valores"
                :key="valor.mes"
                :class="claseCelda(valor.origen, valor.importe)"
              >
                <input
                  v-if="estaEditando(fila.concepto_id, valor.mes)"
                  :value="valorEdicion"
                  type="text"
                  autofocus
                  class="w-full bg-transparent px-2 py-2 text-right outline-none"
                  :aria-label="`Importe de ${MESES_CORTOS[valor.mes - 1]} para ${fila.nombre}`"
                  @input="valorEdicion = ($event.target as HTMLInputElement).value"
                  @keydown.enter="confirmarEdicion()"
                  @keydown.escape="cancelarEdicion()"
                  @blur="confirmarEdicion()"
                />
                <div v-else class="flex items-center justify-end">
                  <TooltipProvider>
                    <Tooltip :delay-duration="300">
                      <TooltipTrigger as-child>
                        <button
                          type="button"
                          class="hover:bg-muted/50 flex-1 px-2 py-2 text-right"
                          @click="empezarEdicion(fila.concepto_id, valor.mes, valor.importe)"
                          @mouseenter="alPasarElRatonPorImporte(fila.concepto_id, valor.mes, valor)"
                          @focus="alPasarElRatonPorImporte(fila.concepto_id, valor.mes, valor)"
                        >
                          {{ formatearImporte(valor.importe) }}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        v-if="comentarioCelda(fila.concepto_id, valor.mes)"
                        class="max-w-xs whitespace-pre-line"
                      >
                        {{ comentarioCelda(fila.concepto_id, valor.mes) }}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <ModalListaMovimientos
                    v-if="mostrarDetalleMes(valor)"
                    :titulo="`${fila.nombre} — ${MESES_CORTOS[valor.mes - 1]} ${anio}`"
                    :movimientos="
                      detalleMovimientos[claveDetalle(fila.concepto_id, valor.mes)] ?? []
                    "
                  >
                    <template #disparador>
                      <button
                        type="button"
                        class="text-muted-foreground hover:text-foreground shrink-0 pr-2"
                        :aria-label="`Ver movimientos de ${fila.nombre} en ${MESES_CORTOS[valor.mes - 1]}`"
                        @click="abrirDetalleMes(fila.concepto_id, valor.mes)"
                      >
                        <Eye class="size-3.5" />
                      </button>
                    </template>
                  </ModalListaMovimientos>
                </div>
              </TableCell>
              <TableCell class="text-right whitespace-nowrap">
                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button variant="ghost" size="icon" aria-label="Cargar acumulado real">
                      <RefreshCw class="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle
                        >¿Cargar acumulado real de "{{ fila.nombre }}"?</AlertDialogTitle
                      >
                      <AlertDialogDescription>
                        Se sobrescribirá con el importe real de los movimientos cualquier mes de
                        {{ anio }} que ya tengas ajustado a mano. Los meses sin movimientos
                        asociados no se modifican.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction @click="emit('cargar-acumulado-real', fila.concepto_id)"
                        >Cargar</AlertDialogAction
                      >
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar"
                  @click="emit('editar', fila.concepto_id)"
                >
                  <Pencil class="size-4" />
                </Button>
                <DialogoConfirmarEliminacion
                  :descripcion="`el concepto previsto ${fila.nombre}`"
                  @confirmar="emit('eliminar', fila.concepto_id)"
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
            <TableRow class="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell
                v-for="(total, indice) in totales"
                :key="indice"
                class="text-right tabular-nums"
                :class="claseColorImporte(total)"
              >
                {{ formatearImporte(total) }}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>
  </section>
</template>
