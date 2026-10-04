export type HttpErrorCode = 'NETWORK' | 'TIMEOUT' | 'HTTP' | 'INVALID_RESPONSE'

export type TokenSource = string | (() => string | Promise<string>)

interface HttpErrorInit {
  status?: number
  details?: unknown
  cause?: unknown
}

export class HttpError extends Error {
  readonly code: HttpErrorCode
  readonly status?: number
  readonly details?: unknown

  constructor(code: HttpErrorCode, message: string, init: HttpErrorInit = {}) {
    super(message, { cause: init.cause })
    this.name = 'HttpError'
    this.code = code
    this.status = init.status
    this.details = init.details
  }
}

export interface PostJsonOptions<T> {
  parse: (data: unknown) => T
  csrfToken?: TokenSource
  timeoutMs?: number
  credentials?: RequestCredentials
}

const DEFAULT_TIMEOUT_MS = 15_000

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

async function resolveToken(source: TokenSource | undefined): Promise<string> {
  if (source === undefined) return ''
  return typeof source === 'function' ? await source() : source
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function extractMessage(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null) {
    for (const key of ['message', 'mensaje', 'error', 'detail']) {
      const value = (data as Record<string, unknown>)[key]
      if (typeof value === 'string' && value.trim()) return value
    }
  }
  return undefined
}

export async function postJson<T>(
  url: string,
  body: unknown,
  { parse, csrfToken, timeoutMs = DEFAULT_TIMEOUT_MS, credentials = 'same-origin' }: PostJsonOptions<T>,
): Promise<T> {
  let token: string
  try {
    token = await resolveToken(csrfToken)
  } catch (cause) {
    throw new HttpError('NETWORK', 'No fue posible obtener el token CSRF.', { cause })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  let data: unknown
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': token,
      },
      body: JSON.stringify(body),
      credentials,
      signal: controller.signal,
    })
    data = await readBody(response)
  } catch (cause) {
    if (controller.signal.aborted) {
      throw new HttpError('TIMEOUT', `El servicio no respondió en ${timeoutMs / 1000} s.`, { cause })
    }
    throw new HttpError('NETWORK', 'No fue posible conectar con el servicio.', { cause })
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new HttpError(
      'HTTP',
      extractMessage(data) ?? `El servicio respondió con un error (HTTP ${response.status}).`,
      { status: response.status, details: data },
    )
  }

  try {
    return parse(data)
  } catch (cause) {
    throw new HttpError('INVALID_RESPONSE', 'La respuesta del servicio no tiene el formato esperado.', {
      status: response.status,
      details: data,
      cause,
    })
  }
}
