/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACCOUNT_API_URL?: string
  readonly VITE_ACCOUNT_STATUS_PATH?: string
  readonly VITE_ACCOUNT_TERCERO_PATH?: string
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
declare const __APP_VERSION__: string
