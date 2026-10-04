const env = import.meta.env

/** Rutas relativas a `apiBaseUrl`, configurables por `.env`. */
export const ACCOUNT_ENDPOINTS = {
  status: env.VITE_ACCOUNT_STATUS_PATH || 'account/status',
  tercero: env.VITE_ACCOUNT_TERCERO_PATH || 'account/tercero',
} as const

/** URL base por defecto cuando el host no envía `apiBaseUrl`. */
export const DEFAULT_API_BASE_URL = env.VITE_ACCOUNT_API_URL || undefined
