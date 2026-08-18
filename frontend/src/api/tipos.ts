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

export interface ResumenImportacion {
  cuenta_id: number
  movimientos_importados: number
  movimientos_omitidos_por_duplicado: number
  categorias_creadas: string[]
  subcategorias_creadas: string[]
}
