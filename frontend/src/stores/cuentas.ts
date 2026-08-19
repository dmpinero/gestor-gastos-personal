import { defineStore } from 'pinia'
import { ref } from 'vue'

import { clienteApi } from '@/api/cliente'
import type { CuentaBancaria, DatosCuenta, DependenciasCuenta } from '@/api/tipos'

export const useTiendaCuentas = defineStore('cuentas', () => {
  const cuentas = ref<CuentaBancaria[]>([])
  const cargando = ref(false)
  const error = ref<string | null>(null)

  async function cargar(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      cuentas.value = await clienteApi.obtener<CuentaBancaria[]>('/cuentas')
    } catch (motivo) {
      error.value = (motivo as Error).message
    } finally {
      cargando.value = false
    }
  }

  async function crear(datos: DatosCuenta): Promise<void> {
    const cuenta = await clienteApi.crear<CuentaBancaria>('/cuentas', datos)
    cuentas.value.push(cuenta)
  }

  async function actualizar(id: number, datos: DatosCuenta): Promise<void> {
    const cuenta = await clienteApi.actualizar<CuentaBancaria>(`/cuentas/${id}`, datos)
    const indice = cuentas.value.findIndex((c) => c.id === id)
    if (indice !== -1) cuentas.value[indice] = cuenta
  }

  async function eliminar(id: number, cascada = false): Promise<void> {
    await clienteApi.eliminar(`/cuentas/${id}${cascada ? '?cascada=true' : ''}`)
    cuentas.value = cuentas.value.filter((c) => c.id !== id)
  }

  async function obtenerDependencias(id: number): Promise<DependenciasCuenta> {
    return clienteApi.obtener<DependenciasCuenta>(`/cuentas/${id}/dependencias`)
  }

  return {
    cuentas,
    cargando,
    error,
    cargar,
    crear,
    actualizar,
    eliminar,
    obtenerDependencias,
  }
})
