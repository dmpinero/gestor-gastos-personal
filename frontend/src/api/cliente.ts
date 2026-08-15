const URL_BASE_API = import.meta.env.VITE_URL_BASE_API ?? '/api/v1'

export class ErrorApi extends Error {
  constructor(
    public readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje)
    this.name = 'ErrorApi'
  }
}

interface OpcionesPeticion {
  cuerpo?: unknown
  token?: string | null
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

  const respuesta = await fetch(`${URL_BASE_API}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
  })

  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, `Error al llamar a ${ruta}: ${respuesta.statusText}`)
  }

  if (respuesta.status === 204) {
    return undefined as T
  }

  return (await respuesta.json()) as T
}

export const clienteApi = {
  obtener: <T>(ruta: string, token?: string | null) => peticion<T>('GET', ruta, { token }),
  crear: <T>(ruta: string, cuerpo: unknown, token?: string | null) =>
    peticion<T>('POST', ruta, { cuerpo, token }),
  actualizar: <T>(ruta: string, cuerpo: unknown, token?: string | null) =>
    peticion<T>('PUT', ruta, { cuerpo, token }),
  eliminar: <T>(ruta: string, token?: string | null) => peticion<T>('DELETE', ruta, { token }),
}
