import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

const paqueteJson = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8')) as {
  version: string
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  // La versión mostrada en la barra de estado se sincroniza en cada release
  // de GitHub (ver .releaserc.json, plugin @semantic-release/npm que
  // actualiza frontend/package.json); aquí solo se lee en build-time.
  define: {
    __VERSION_APP__: JSON.stringify(paqueteJson.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // El cliente API llama a rutas relativas ('/api/v1/...' por defecto); en
    // desarrollo se reenvían al backend local. En producción cumple el mismo
    // papel el proxy de Nginx (ver nginx.conf).
    proxy: {
      '/api/v1': 'http://127.0.0.1:8000',
    },
  },
})
