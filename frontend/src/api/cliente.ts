const URL_BASE_API = import.meta.env.VITE_URL_BASE_API ?? '/api/v1'

export class ErrorApi extends Error {
  constructor(
    public readonly estado: number,
    mensaje: string,
    public readonly traza?: string,
  ) {
    super(mensaje)
    this.name = 'ErrorApi'
  }
}

interface OpcionesPeticion {
  cuerpo?: unknown
  token?: string | null
}

interface DetalleError {
  mensaje: string
  traza?: string
}

async function extraerDetalleError(respuesta: Response): Promise<DetalleError> {
  try {
    const datos = await respuesta.clone().json()
    const traza = typeof datos.traza === 'string' ? datos.traza : undefined
    if (typeof datos.detalle === 'string') return { mensaje: datos.detalle, traza }
    if (typeof datos.detail === 'string') return { mensaje: datos.detail, traza }
    if (Array.isArray(datos.detail)) {
      return {
        mensaje: datos.detail.map((error: { msg?: string }) => error.msg).join('; '),
        traza,
      }
    }
  } catch {
    // El cuerpo no era JSON; se usa el texto del estado HTTP como mensaje.
  }
  return { mensaje: respuesta.statusText }
}

async function peticion<T>(
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE',
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<T> {
  const cabeceras: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (opciones.token) {
    cabeceras.Authorization = `Bearer ${opciones.token}`
  }

  const opcionesFetch: RequestInit = {
    method: metodo,
    headers: cabeceras,
    ...(opciones.cuerpo ? { body: JSON.stringify(opciones.cuerpo) } : {}),
  }
  const respuesta = await fetch(`${URL_BASE_API}${ruta}`, opcionesFetch)

  if (!respuesta.ok) {
    const { mensaje, traza } = await extraerDetalleError(respuesta)
    throw new ErrorApi(respuesta.status, mensaje, traza)
  }

  if (respuesta.status === 204) {
    return undefined as T
  }

  return (await respuesta.json()) as T
}

async function descargar(ruta: string): Promise<Blob> {
  const respuesta = await fetch(`${URL_BASE_API}${ruta}`)

  if (!respuesta.ok) {
    const { mensaje, traza } = await extraerDetalleError(respuesta)
    throw new ErrorApi(respuesta.status, mensaje, traza)
  }

  return await respuesta.blob()
}

async function subirArchivo<T>(ruta: string, campo: string, fichero: File): Promise<T> {
  const formData = new FormData()
  formData.append(campo, fichero)

  const respuesta = await fetch(`${URL_BASE_API}${ruta}`, {
    method: 'POST',
    body: formData,
  })

  if (!respuesta.ok) {
    const { mensaje, traza } = await extraerDetalleError(respuesta)
    throw new ErrorApi(respuesta.status, mensaje, traza)
  }

  return (await respuesta.json()) as T
}

interface EventoNdjson {
  tipo: string
  procesadas?: number
  total?: number
}

/**
 * Como `subirArchivo`, pero para endpoints que devuelven el progreso en
 * streaming: una línea NDJSON `{"tipo":"progreso",...}` por cada unidad de
 * trabajo procesada (se traduce en una llamada a `alProgreso`) y, al final,
 * una línea `{"tipo":"resumen",...}` con el resultado, que es lo que
 * resuelve la promesa.
 */
async function subirArchivoConProgreso<T>(
  ruta: string,
  campo: string,
  fichero: File,
  alProgreso: (procesadas: number, total: number) => void,
): Promise<T> {
  const formData = new FormData()
  formData.append(campo, fichero)

  const respuesta = await fetch(`${URL_BASE_API}${ruta}`, {
    method: 'POST',
    body: formData,
  })

  if (!respuesta.ok) {
    const { mensaje, traza } = await extraerDetalleError(respuesta)
    throw new ErrorApi(respuesta.status, mensaje, traza)
  }
  if (!respuesta.body) {
    return (await respuesta.json()) as T
  }

  let resumen: T | undefined

  function procesarLinea(linea: string): void {
    if (!linea.trim()) return
    const evento = JSON.parse(linea) as EventoNdjson
    if (evento.tipo === 'progreso') {
      alProgreso(evento.procesadas ?? 0, evento.total ?? 0)
    } else if (evento.tipo === 'resumen') {
      // Se descarta el discriminador "tipo": es solo protocolo de
      // transporte, no forma parte de la forma de T.
      const { tipo: descartado, ...resto } = evento as EventoNdjson & Record<string, unknown>
      void descartado
      resumen = resto as T
    }
  }

  const lector = respuesta.body.getReader()
  const decodificador = new TextDecoder()
  let restoSinProcesar = ''
  for (;;) {
    const { value, done } = await lector.read()
    if (done) break
    restoSinProcesar += decodificador.decode(value, { stream: true })
    const lineas = restoSinProcesar.split('\n')
    restoSinProcesar = lineas.pop() ?? ''
    for (const linea of lineas) procesarLinea(linea)
  }
  if (restoSinProcesar.trim()) procesarLinea(restoSinProcesar)

  if (resumen === undefined) {
    throw new ErrorApi(0, 'La importación se interrumpió antes de terminar.')
  }
  return resumen
}

export const clienteApi = {
  obtener: <T>(ruta: string, token?: string | null) => peticion<T>('GET', ruta, { token }),
  crear: <T>(ruta: string, cuerpo: unknown, token?: string | null) =>
    peticion<T>('POST', ruta, { cuerpo, token }),
  actualizar: <T>(ruta: string, cuerpo: unknown, token?: string | null) =>
    peticion<T>('PUT', ruta, { cuerpo, token }),
  eliminar: <T>(ruta: string, token?: string | null) => peticion<T>('DELETE', ruta, { token }),
  subirArchivo,
  subirArchivoConProgreso,
  descargar,
}
