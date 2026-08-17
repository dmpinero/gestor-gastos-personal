/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_URL_BASE_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __VERSION_APP__: string
