// La versión y el historial de cambios de la aplicación se leen en vivo desde
// la API pública de GitHub (el repositorio es público, no requiere token) en
// vez de "congelarse" en el build. Así siempre coincide con la última release
// publicada, sin depender de que el pipeline de release pueda escribir de
// vuelta en la rama protegida `main`.
const REPOSITORIO = 'dmpinero/gestor-gastos-personal'
const URL_BASE = `https://api.github.com/repos/${REPOSITORIO}`

export interface ReleaseGitHub {
  tag_name: string
  name: string | null
  body: string | null
  published_at: string | null
  html_url: string
}

export async function obtenerUltimaVersion(): Promise<string> {
  const respuesta = await fetch(`${URL_BASE}/releases/latest`)
  if (!respuesta.ok) {
    throw new Error('No se pudo obtener la versión desde GitHub.')
  }
  const release = (await respuesta.json()) as ReleaseGitHub
  return release.tag_name.replace(/^v/, '')
}

export async function obtenerHistorialDeReleases(): Promise<ReleaseGitHub[]> {
  const respuesta = await fetch(`${URL_BASE}/releases`)
  if (!respuesta.ok) {
    throw new Error('No se pudo obtener el historial de cambios desde GitHub.')
  }
  return (await respuesta.json()) as ReleaseGitHub[]
}
