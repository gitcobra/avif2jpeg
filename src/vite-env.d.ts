/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_BASE_PATH: string
  readonly VITE_OUTDIR: string
  readonly VITE_APP_INJECT_GA: number
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
