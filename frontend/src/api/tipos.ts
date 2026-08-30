export interface CuentaBancaria {
  id: number
  numero_cuenta: string
  alias: string | null
  entidad_bancaria: string | null
  moneda: string | null
  titular: string | null
}

export interface DatosCuenta {
  numero_cuenta: string
  alias?: string | null
  entidad_bancaria?: string | null
  moneda?: string | null
  titular?: string | null
}

export interface Categoria {
  id: number
  nombre: string
}

export interface Subcategoria {
  id: number
  nombre: string
  categoria_id: number
}

export interface CategoriaConSubcategorias {
  categoria: Categoria
  subcategorias: Subcategoria[]
}

export interface Movimiento {
  id: number
  cuenta_id: number
  categoria_id: number
  subcategoria_id: number | null
  fecha_valor: string
  descripcion: string
  comentario: string | null
  importe: string
  saldo: string
}

export interface DatosMovimiento {
  cuenta_id: number
  categoria_id: number
  subcategoria_id?: number | null
  fecha_valor: string
  descripcion: string
  comentario?: string | null
  importe: string
  saldo: string
}

export interface FilaMovimientoExcel {
  fecha_valor: string
  categoria: string
  subcategoria: string | null
  descripcion: string
  comentario: string | null
  importe: string
  saldo: string
}

export interface DuplicadoDetectado {
  fila_excel: FilaMovimientoExcel
  movimiento_existente: Movimiento
}

export interface ResumenImportacion {
  cuenta_id: number
  movimientos_importados: number
  movimientos_omitidos_por_duplicado: number
  categorias_creadas: string[]
  subcategorias_creadas: string[]
  duplicados: DuplicadoDetectado[]
}

export interface SaldoCuenta {
  cuenta_id: number
  numero_cuenta: string
  alias: string | null
  saldo: string
}

export interface TotalCategoria {
  categoria_id: number
  nombre: string
  total: string
}

export interface ResumenDashboard {
  saldo_global: string
  saldos_por_cuenta: SaldoCuenta[]
  gastos_por_categoria: TotalCategoria[]
  ingresos_por_categoria: TotalCategoria[]
}

export interface DependenciasCuenta {
  movimientos: number
}

export interface DependenciasCategoria {
  subcategorias: number
  movimientos: number
  conceptos_previstos: number
}

export interface DependenciasSubcategoria {
  movimientos: number
  conceptos_previstos: number
}

export type Periodicidad = 'mensual' | 'trimestral' | 'semestral' | 'anual'

export interface ConceptoPrevisto {
  id: number
  categoria_id: number
  subcategoria_id: number | null
  periodicidad: Periodicidad
  mes_inicio: number | null
  importe_previsto: string
}

export interface DatosConceptoPrevisto {
  categoria_id: number
  subcategoria_id?: number | null
  periodicidad: Periodicidad
  mes_inicio?: number | null
  importe_previsto: string
}

export type OrigenValorMensual = 'real' | 'previsto' | 'ajustado'

export interface ValorMensual {
  mes: number
  importe: string
  origen: OrigenValorMensual
}

export interface FilaResumenAnual {
  concepto_id: number
  categoria_id: number
  subcategoria_id: number | null
  nombre: string
  periodicidad: Periodicidad
  valores: ValorMensual[]
}

export interface ResumenAnual {
  anio: number
  filas_gastos: FilaResumenAnual[]
  filas_ingresos: FilaResumenAnual[]
  totales_gastos: string[]
  totales_ingresos: string[]
}

export interface AsociacionConcepto {
  id: number
  categoria_resumen_id: number
  subcategoria_resumen_id: number | null
  categoria_movimiento_id: number
  subcategoria_movimiento_id: number | null
}

export interface DatosAsociacion {
  categoria_resumen_id: number
  subcategoria_resumen_id?: number | null
  categoria_movimiento_id: number
  subcategoria_movimiento_id?: number | null
}

export interface AsociacionDescripcion {
  id: number
  categoria_resumen_id: number
  subcategoria_resumen_id: number | null
  descripcion: string
}

export interface DatosAsociacionDescripcion {
  categoria_resumen_id: number
  subcategoria_resumen_id?: number | null
  descripcion: string
}

export interface ResumenImportacionResumenAnual {
  celdas_actualizadas: number
  celdas_eliminadas: number
  conceptos_no_encontrados: number
}

export interface ResumenImportacionConceptosPrevistos {
  conceptos_creados: number
  conceptos_omitidos_por_duplicado: number
  categorias_creadas: string[]
  subcategorias_creadas: string[]
}

export interface ResumenImportacionDatosCompletos {
  cuentas_importadas: number
  categorias_importadas: number
  subcategorias_importadas: number
  movimientos_importados: number
  conceptos_previstos_importados: number
  ajustes_importados: number
  asociaciones_importadas: number
  asociaciones_descripcion_importadas: number
}
