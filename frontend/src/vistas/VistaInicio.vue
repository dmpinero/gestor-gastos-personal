<script setup lang="ts">
import { computed, onMounted } from 'vue'
import ListaTotalesCategoria from '@/componentes/dashboard/ListaTotalesCategoria.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { formatearImporte } from '@/lib/formato'
import { agruparMovimientosPorCategoria } from '@/lib/movimientosPorCategoria'
import { useTiendaCategorias } from '@/stores/categorias'
import { useTiendaCuentas } from '@/stores/cuentas'
import { useTiendaDashboard } from '@/stores/dashboard'
import { useTiendaMovimientos } from '@/stores/movimientos'

const tienda = useTiendaDashboard()
const tiendaCuentas = useTiendaCuentas()
const tiendaCategorias = useTiendaCategorias()
const tiendaMovimientos = useTiendaMovimientos()

onMounted(async () => {
  tienda.cargar()
  tiendaCategorias.cargar()
  // El resumen del backend solo trae totales agregados por categoría; para
  // habilitar "Detalles" (misma modal que en Movimientos, con los
  // movimientos reales) hace falta cargar los movimientos de todas las
  // cuentas y agruparlos en el cliente.
  await tiendaCuentas.cargar()
  await tiendaMovimientos.cargarVarias(tiendaCuentas.cuentas.map((c) => c.id))
})

function nombreSubcategoria(idSubcategoria: number | null): string {
  if (idSubcategoria === null) return ''
  for (const c of tiendaCategorias.categorias) {
    const sub = c.subcategorias.find((s) => s.id === idSubcategoria)
    if (sub) return sub.nombre
  }
  return ''
}

const movimientosPorCategoriaGastos = computed(() =>
  agruparMovimientosPorCategoria(
    tiendaMovimientos.movimientos.filter((m) => Number(m.importe) < 0),
    nombreSubcategoria,
  ),
)
const movimientosPorCategoriaIngresos = computed(() =>
  agruparMovimientosPorCategoria(
    tiendaMovimientos.movimientos.filter((m) => Number(m.importe) > 0),
    nombreSubcategoria,
  ),
)
</script>

<template>
  <section>
    <h2 class="text-xl font-semibold">Panel principal</h2>

    <p v-if="tienda.error" class="text-destructive mt-2 text-sm" role="alert">
      {{ tienda.error }}
    </p>

    <template v-else-if="tienda.resumen">
      <div class="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-muted-foreground text-sm font-medium">Saldo global</CardTitle>
          </CardHeader>
          <CardContent class="text-2xl font-semibold">
            {{ formatearImporte(tienda.resumen.saldo_global) }}
          </CardContent>
        </Card>
        <Card v-for="cuenta in tienda.resumen.saldos_por_cuenta" :key="cuenta.cuenta_id">
          <CardHeader>
            <CardTitle class="text-muted-foreground truncate text-sm font-medium">
              {{ cuenta.alias ?? cuenta.numero_cuenta }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-2xl font-semibold">
            {{ formatearImporte(cuenta.saldo) }}
          </CardContent>
        </Card>
      </div>

      <Card class="mt-6">
        <CardContent>
          <ListaTotalesCategoria
            titulo="Gastos por categoría"
            :items="tienda.resumen.gastos_por_categoria"
            acento="gasto"
            mensaje-vacio="No hay gastos registrados todavía."
            :movimientos-por-categoria="movimientosPorCategoriaGastos"
          />
        </CardContent>
      </Card>

      <Card class="mt-6">
        <CardContent>
          <ListaTotalesCategoria
            titulo="Ingresos por categoría"
            :items="tienda.resumen.ingresos_por_categoria"
            acento="ingreso"
            mensaje-vacio="No hay ingresos registrados todavía."
            :movimientos-por-categoria="movimientosPorCategoriaIngresos"
          />
        </CardContent>
      </Card>
    </template>
  </section>
</template>
