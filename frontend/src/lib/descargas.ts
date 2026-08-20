export function descargarBlob(blob: Blob, nombreFichero: string): void {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreFichero
  enlace.click()
  URL.revokeObjectURL(url)
}
