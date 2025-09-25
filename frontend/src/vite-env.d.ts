/// <reference types="vite/client" />

// Better Vue 3 + Volar support
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

interface Window {
  $notify?: {
    success(message: string, detail?: string): void
    info(message: string, detail?: string): void
    warn(message: string, detail?: string): void
    error(message: string, detail?: string): void
  }
}
