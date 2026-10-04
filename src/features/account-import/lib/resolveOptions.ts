import { z } from 'zod/mini'
import { DEFAULT_API_BASE_URL } from '../api/endpoints'
import { DEFAULT_TEXTS } from '../texts'
import type { AccountWidgetOptions, ResolvedOptions } from '../types'
import { AccountWidgetError } from './widgetError'

const DEFAULTS = {
  withCredentials: false,
  sendNiuAsNumber: true,
  maxFileSizeKb: 512,
  maxRows: 1000,
  requestTimeoutMs: 15_000,
}

const fn = z.optional(
  z.custom<(...args: never[]) => unknown>((value) => typeof value === 'function', {
    message: 'Debe ser una función',
  }),
)
const positiveInt = z.optional(z.number().check(z.int(), z.positive()))

const optionsSchema = z.object({
  email: z.email('`email` debe ser un correo válido'),
  apiBaseUrl: z.string().check(z.trim(), z.minLength(1, '`apiBaseUrl` es obligatorio')),
  csrfToken: z.optional(z.string()),
  getCsrfToken: fn,
  withCredentials: z.optional(z.boolean()),
  sendNiuAsNumber: z.optional(z.boolean()),
  maxFileSizeKb: z.optional(z.number().check(z.positive())),
  maxRows: positiveInt,
  requestTimeoutMs: positiveInt,
  texts: z.optional(z.record(z.string(), z.string())),
  onReady: fn,
  onOpen: fn,
  onClose: fn,
  onFileParsed: fn,
  onStatusLoaded: fn,
  onSuccess: fn,
  onError: fn,
  onComplete: fn,
})

/** Valida (en runtime, el host puede ser JS plano) y completa las opciones con valores por defecto. */
export function resolveOptions(raw: unknown): ResolvedOptions {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<AccountWidgetOptions>
  const withDefaults = {
    ...input,
    apiBaseUrl: input.apiBaseUrl ?? DEFAULT_API_BASE_URL,
  }
  const result = optionsSchema.safeParse(withDefaults)
  if (!result.success) {
    throw new AccountWidgetError('CONFIG_INVALID', z.prettifyError(result.error), {
      details: result.error.issues,
    })
  }

  const options = withDefaults as AccountWidgetOptions & { apiBaseUrl: string }
  return {
    ...DEFAULTS,
    ...options,
    texts: { ...DEFAULT_TEXTS, ...options.texts },
  }
}
