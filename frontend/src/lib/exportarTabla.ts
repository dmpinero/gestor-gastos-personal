import { descargarBlob } from './descargas'

// exceljs y jspdf (+ jspdf-autotable) son librerías pesadas que solo hacen
// falta al pulsar "exportar"; se cargan con import() dinámico para que no
// engorden el paquete principal de la aplicación en cada visita.
export async function exportarTablaExcel(
  nombreFichero: string,
  columnas: string[],
  filas: (string | number)[][],
): Promise<void> {
  const { default: excelJS } = await import('exceljs')
  const libro = new excelJS.Workbook()
  const hoja = libro.addWorksheet('Datos')
  hoja.addRow(columnas).font = { bold: true }
  for (const fila of filas) hoja.addRow(fila)
  hoja.columns.forEach((columna) => {
    columna.width = 22
  })

  const buffer = await libro.xlsx.writeBuffer()
  descargarBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    nombreFichero,
  )
}

export async function exportarTablaPDF(
  nombreFichero: string,
  titulo: string,
  columnas: string[],
  filas: (string | number)[][],
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const documento = new jsPDF()
  documento.setFontSize(14)
  documento.text(titulo, 14, 15)
  autoTable(documento, { head: [columnas], body: filas, startY: 20 })
  documento.save(nombreFichero)
}
