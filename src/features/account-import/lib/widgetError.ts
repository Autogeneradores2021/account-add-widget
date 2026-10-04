import { HttpError } from '../../../lib/http'

export type AccountWidgetErrorCode =
  | 'CONFIG_INVALID'
  | 'FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'CSV_EMPTY'
  | 'CSV_INVALID'
  | 'TOO_MANY_ROWS'
  | 'NO_EXISTING_ACCOUNTS'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'HTTP'
  | 'INVALID_RESPONSE'
  | 'UNEXPECTED'

const DEFAULT_MESSAGES: Record<AccountWidgetErrorCode, string> = {
  CONFIG_INVALID: 'La configuración del widget no es válida.',
  FILE_TYPE: 'El archivo debe tener extensión .csv.',
  FILE_TOO_LARGE: 'El archivo supera el tamaño máximo permitido.',
  CSV_EMPTY: 'El archivo no contiene cuentas.',
  CSV_INVALID: 'El archivo no contiene NIU numéricos válidos.',
  TOO_MANY_ROWS: 'El archivo supera la cantidad máxima de cuentas.',
  NO_EXISTING_ACCOUNTS: 'Ninguna de las cuentas existe.',
  NETWORK: 'No fue posible conectar con el servicio.',
  TIMEOUT: 'El servicio tardó demasiado en responder.',
  HTTP: 'El servicio respondió con un error.',
  INVALID_RESPONSE: 'La respuesta del servicio no tiene el formato esperado.',
  UNEXPECTED: 'Ocurrió un error inesperado.',
}

interface WidgetErrorInit {
  status?: number
  details?: unknown
  cause?: unknown
}

export class AccountWidgetError extends Error {
  readonly code: AccountWidgetErrorCode
  readonly status?: number
  readonly details?: unknown

  constructor(code: AccountWidgetErrorCode, message?: string, init: WidgetErrorInit = {}) {
    super(message ?? DEFAULT_MESSAGES[code], { cause: init.cause })
    this.name = 'AccountWidgetError'
    this.code = code
    this.status = init.status
    this.details = init.details
  }
}

export function toWidgetError(error: unknown): AccountWidgetError {
  if (error instanceof AccountWidgetError) return error
  if (error instanceof HttpError) {
    return new AccountWidgetError(error.code, error.message, {
      status: error.status,
      details: error.details,
      cause: error,
    })
  }
  return new AccountWidgetError(
    'UNEXPECTED',
    error instanceof Error ? error.message : undefined,
    { cause: error },
  )
}
