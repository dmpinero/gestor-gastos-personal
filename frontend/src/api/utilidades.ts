/** Convierte una cadena vacía o solo espacios en `null`, para no enviar '' como si fuera un valor. */
export function aTextoOULlo(valor: string): string | null {
  const recortado = valor.trim()
  return recortado === '' ? null : recortado
}
