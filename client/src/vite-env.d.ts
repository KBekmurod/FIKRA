/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />


interface ImportMetaEnv {
  readonly PROD: boolean
  readonly DEV: boolean
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
