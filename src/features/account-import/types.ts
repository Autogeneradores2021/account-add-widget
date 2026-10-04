import type { AccountWidgetError } from './lib/widgetError'
import type { WidgetTexts } from './texts'

export interface AccountStatus {
  niu: string
  existe: boolean
  direccion: string | null
  propietario: string | null
}

export interface InvalidCsvValue {
  line: number
  column: number
  value: string
}

export interface CsvParseResult {
  nius: string[]
  invalidValues: InvalidCsvValue[]
  duplicates: number
  headerSkipped: boolean
}

export interface AssociationResult {
  email: string
  associated: string[]
  skipped: string[]
  response: unknown
}

export type CompletionResult =
  | { status: 'success'; result: AssociationResult }
  | { status: 'error'; error: AccountWidgetError }
  | { status: 'cancelled' }

export type WidgetPhase = 'idle' | 'checking' | 'review' | 'submitting' | 'success' | 'error'

export type CloseReason = 'user' | 'api' | 'completed'

export interface WidgetEventMap {
  ready: undefined
  open: undefined
  close: { reason: CloseReason }
  fileParsed: CsvParseResult
  statusLoaded: AccountStatus[]
  success: AssociationResult
  error: AccountWidgetError
  complete: CompletionResult
}

export type WidgetEventName = keyof WidgetEventMap

export type AccountWidgetCallbacks = {
  [K in WidgetEventName as `on${Capitalize<K>}`]?: (detail: WidgetEventMap[K]) => void
}

export interface AccountWidgetOptions extends AccountWidgetCallbacks {
  /** Email del tercero al que se asocian las cuentas. */
  email: string
  /** URL base del API. Por defecto `VITE_ACCOUNT_API_URL`. */
  apiBaseUrl?: string
  /** Token CSRF fijo para el header `X-CSRF-TOKEN`. */
  csrfToken?: string
  /** Función (sync o async) que devuelve el token CSRF; tiene prioridad sobre `csrfToken`. */
  getCsrfToken?: () => string | Promise<string>
  /** Envía cookies en peticiones cross-origin (`credentials: 'include'`). */
  withCredentials?: boolean
  /** Envía los NIU a `account/tercero` como número (contrato actual del API). */
  sendNiuAsNumber?: boolean
  maxFileSizeKb?: number
  maxRows?: number
  requestTimeoutMs?: number
  texts?: Partial<WidgetTexts>
}

export interface ResolvedOptions extends AccountWidgetOptions {
  apiBaseUrl: string
  withCredentials: boolean
  sendNiuAsNumber: boolean
  maxFileSizeKb: number
  maxRows: number
  requestTimeoutMs: number
  texts: WidgetTexts
}

export interface WidgetEvents {
  emit<K extends WidgetEventName>(name: K, detail: WidgetEventMap[K]): void
}

export interface AccountWidgetInstance {
  open(): void
  close(): void
  reset(): void
  update(options: Partial<AccountWidgetOptions>): void
  getState(): WidgetPhase
  destroy(): void
}
