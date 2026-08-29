<script setup lang="ts">
import { ArrowRight, Link2, Trash2 } from '@lucide/vue'
import { computed, onMounted, reactive } from 'vue'
import { useTiendaAsociaciones } from '@/stores/asociaciones'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaPrevisiones } from '@/stores/previsiones'
import DialogoConfirmarEliminacion from '@/componentes/compartido/DialogoConfirmarEliminacion.vue'
import { Button } from '@/componentes/ui/button'
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

const tiendaAsociaciones = useTiendaAsociaciones()
const tiendaCategorias = useTiendaCategorias()
const tiendaPrevisiones = useTiendaPrevisiones()

onMounted(() => {
  tiendaAsociaciones.cargar()
  tiendaCategorias.cargar()
  tiendaPrevisiones.cargar()
})

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

// Mismo criterio que el backend para nombrar un concepto: la subcategoría
// si la tiene, si no el nombre de la categoría (ver ObtenerResumenAnual).
function nombreConcepto(idCategoria: number, idSubcategoria: number | null): string {
  return nombreSubcategoria(idSubcategoria) || nombreCategoria(idCategoria)
}

const SIN_SUBCATEGORIA = 'sin-subcategoria'

const formulario = reactive({
  categoriaResumenId: '',
  subcategoriaResumenId: SIN_SUBCATEGORIA,
  categoriaMovimientoId: '',
  subcategoriaMovimientoId: SIN_SUBCATEGORIA,
})

function subcategoriasDe(idCategoriaTexto: string) {
  const categoria = tiendaCategorias.categorias.find(
    (c) => c.categoria.id === Number(idCategoriaTexto),
  )
  return categoria?.subcategorias ?? []
}

const subcategoriasDelResumen = computed(() => subcategoriasDe(formulario.categoriaResumenId))
const subcategoriasDelMovimiento = computed(() => subcategoriasDe(formulario.categoriaMovimientoId))

const errorFormulario = computed(() => tiendaAsociaciones.error)

function limpiarFormulario(): void {
  formulario.categoriaResumenId = ''
  formulario.subcategoriaResumenId = SIN_SUBCATEGORIA
  formulario.categoriaMovimientoId = ''
  formulario.subcategoriaMovimientoId = SIN_SUBCATEGORIA
}

function usarConceptoSinAsociar(idCategoria: number, idSubcategoria: number | null): void {
  formulario.categoriaResumenId = String(idCategoria)
  formulario.subcategoriaResumenId =
    idSubcategoria === null ? SIN_SUBCATEGORIA : String(idSubcategoria)
}

async function crearAsociacion(): Promise<void> {
  tiendaAsociaciones.error = null
  try {
    await tiendaAsociaciones.crear({
      categoria_resumen_id: Number(formulario.categoriaResumenId),
      subcategoria_resumen_id:
        formulario.subcategoriaResumenId === SIN_SUBCATEGORIA
          ? null
          : Number(formulario.subcategoriaResumenId),
      categoria_movimiento_id: Number(formulario.categoriaMovimientoId),
      subcategoria_movimiento_id:
        formulario.subcategoriaMovimientoId === SIN_SUBCATEGORIA
          ? null
          : Number(formulario.subcategoriaMovimientoId),
    })
    limpiarFormulario()
  } catch {
    // El error ya queda reflejado en tiendaAsociaciones.error.
  }
}

async function eliminarAsociacion(id: number): Promise<void> {
  await tiendaAsociaciones.eliminar(id)
}

// Conceptos previstos del resumen anual cuya categoría/subcategoría todavía
// no tiene una asociación creada: ayuda a encontrar qué falta mapear.
const conceptosSinAsociar = computed(() => {
  const clavesAsociadas = new Set(
    tiendaAsociaciones.asociaciones.map(
      (a) => `${a.categoria_resumen_id}:${a.subcategoria_resumen_id}`,
    ),
  )
  const vistos = new Set<string>()
  return tiendaPrevisiones.conceptos.filter((c) => {
    const clave = `${c.categoria_id}:${c.subcategoria_id}`
    if (clavesAsociadas.has(clave) || vistos.has(clave)) return false
    vistos.add(clave)
    return true
  })
})
</script>

<template>
  <section>
    <p class="text-muted-foreground max-w-prose text-sm">
      Algunos conceptos del Resumen anual se nombran de forma distinta a la categoría real que usan
      los movimientos (por ejemplo, "Comida" en el resumen anual y "Alimentación" en movimientos).
      Crea aquí la correspondencia entre ambos para que el Resumen anual encuentre el importe real
      de esos conceptos.
    </p>

    <form
      class="bg-muted/40 mt-4 flex flex-wrap items-end gap-4 rounded-lg border p-4"
      @submit.prevent="crearAsociacion"
    >
      <div class="flex flex-col gap-1.5">
        <Label id="etiqueta-categoria-resumen" for="selector-categoria-resumen"
          >Categoría del Resumen anual</Label
        >
        <Select v-model="formulario.categoriaResumenId">
          <SelectTrigger
            id="selector-categoria-resumen"
            aria-labelledby="etiqueta-categoria-resumen"
          >
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="item in tiendaCategorias.categorias"
              :key="item.categoria.id"
              :value="String(item.categoria.id)"
            >
              {{ item.categoria.nombre }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label id="etiqueta-subcategoria-resumen" for="selector-subcategoria-resumen"
          >Subcategoría del Resumen anual</Label
        >
        <Select v-model="formulario.subcategoriaResumenId">
          <SelectTrigger
            id="selector-subcategoria-resumen"
            aria-labelledby="etiqueta-subcategoria-resumen"
          >
            <SelectValue placeholder="(sin subcategoría)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</SelectItem>
            <SelectItem v-for="s in subcategoriasDelResumen" :key="s.id" :value="String(s.id)">
              {{ s.nombre }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ArrowRight class="text-muted-foreground mb-2.5 size-5 shrink-0" />

      <div class="flex flex-col gap-1.5">
        <Label id="etiqueta-categoria-movimiento" for="selector-categoria-movimiento"
          >Categoría real de Movimientos</Label
        >
        <Select v-model="formulario.categoriaMovimientoId">
          <SelectTrigger
            id="selector-categoria-movimiento"
            aria-labelledby="etiqueta-categoria-movimiento"
          >
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="item in tiendaCategorias.categorias"
              :key="item.categoria.id"
              :value="String(item.categoria.id)"
            >
              {{ item.categoria.nombre }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label id="etiqueta-subcategoria-movimiento" for="selector-subcategoria-movimiento"
          >Subcategoría real de Movimientos</Label
        >
        <Select v-model="formulario.subcategoriaMovimientoId">
          <SelectTrigger
            id="selector-subcategoria-movimiento"
            aria-labelledby="etiqueta-subcategoria-movimiento"
          >
            <SelectValue placeholder="(sin subcategoría)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="SIN_SUBCATEGORIA">(sin subcategoría)</SelectItem>
            <SelectItem v-for="s in subcategoriasDelMovimiento" :key="s.id" :value="String(s.id)">
              {{ s.nombre }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        variant="success"
        :disabled="!formulario.categoriaResumenId || !formulario.categoriaMovimientoId"
      >
        <Link2 class="size-4" />
        Crear asociación
      </Button>
    </form>

    <p v-if="errorFormulario" class="mt-2 text-sm text-destructive" role="alert">
      {{ errorFormulario }}
    </p>

    <div v-if="conceptosSinAsociar.length > 0" class="mt-6">
      <h3 class="text-muted-foreground text-sm font-medium">
        Conceptos del Resumen anual sin asociar
      </h3>
      <ul class="mt-2 flex flex-wrap gap-2">
        <li v-for="concepto in conceptosSinAsociar" :key="concepto.id">
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="usarConceptoSinAsociar(concepto.categoria_id, concepto.subcategoria_id)"
          >
            {{ nombreConcepto(concepto.categoria_id, concepto.subcategoria_id) }}
          </Button>
        </li>
      </ul>
    </div>

    <div class="mt-6">
      <h3 class="text-muted-foreground text-sm font-medium">Asociaciones creadas</h3>
      <p
        v-if="tiendaAsociaciones.asociaciones.length === 0"
        class="text-muted-foreground mt-2 text-sm"
      >
        Todavía no has creado ninguna asociación.
      </p>
      <div v-else class="mt-2 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto del Resumen anual</TableHead>
              <TableHead>Categoría real de Movimientos</TableHead>
              <TableHead class="w-9"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="asociacion in tiendaAsociaciones.asociaciones" :key="asociacion.id">
              <TableCell>
                {{
                  nombreConcepto(
                    asociacion.categoria_resumen_id,
                    asociacion.subcategoria_resumen_id,
                  )
                }}
              </TableCell>
              <TableCell>
                {{
                  nombreConcepto(
                    asociacion.categoria_movimiento_id,
                    asociacion.subcategoria_movimiento_id,
                  )
                }}
              </TableCell>
              <TableCell class="text-right">
                <DialogoConfirmarEliminacion
                  :descripcion="`esta asociación`"
                  @confirmar="eliminarAsociacion(asociacion.id)"
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
      </div>
    </div>
  </section>
</template>
