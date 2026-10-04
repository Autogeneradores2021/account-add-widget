import { joinUrl, postJson, type TokenSource } from '../../../lib/http'
import type { AccountStatus, ResolvedOptions } from '../types'
import { ACCOUNT_ENDPOINTS } from './endpoints'
import { accountStatusResponseSchema, associateResponseSchema } from './schemas'

export interface ApiConfig {
  apiBaseUrl: string
  csrfToken?: TokenSource
  timeoutMs: number
  withCredentials: boolean
}

export function toApiConfig(options: ResolvedOptions): ApiConfig {
  return {
    apiBaseUrl: options.apiBaseUrl,
    csrfToken: options.getCsrfToken ?? options.csrfToken,
    timeoutMs: options.requestTimeoutMs,
    withCredentials: options.withCredentials,
  }
}

function requestOptions(config: ApiConfig) {
  return {
    csrfToken: config.csrfToken,
    timeoutMs: config.timeoutMs,
    credentials: config.withCredentials ? 'include' : 'same-origin',
  } as const
}

export async function fetchAccountStatus(config: ApiConfig, nius: string[]): Promise<AccountStatus[]> {
  const response = await postJson(
    joinUrl(config.apiBaseUrl, ACCOUNT_ENDPOINTS.status),
    { niu: nius },
    { ...requestOptions(config), parse: (data) => accountStatusResponseSchema.parse(data) },
  )
  return response.data
}

export interface AssociatePayload {
  email: string
  nius: string[]
  sendNiuAsNumber: boolean
}

function toApiNiu(niu: string, asNumber: boolean): string | number {
  const numeric = Number(niu)
  // Se conserva como texto si convertirlo perdería precisión o ceros a la izquierda.
  return asNumber && Number.isSafeInteger(numeric) && String(numeric) === niu ? numeric : niu
}

export function associateAccounts(config: ApiConfig, payload: AssociatePayload): Promise<unknown> {
  return postJson(
    joinUrl(config.apiBaseUrl, ACCOUNT_ENDPOINTS.tercero),
    { email: payload.email, niu: payload.nius.map((niu) => toApiNiu(niu, payload.sendNiuAsNumber)) },
    { ...requestOptions(config), parse: (data) => associateResponseSchema.parse(data) },
  )
}
