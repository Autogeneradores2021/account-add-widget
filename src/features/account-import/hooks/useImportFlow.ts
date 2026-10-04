import { useReducer } from 'react'
import type { AccountWidgetError } from '../lib/widgetError'
import type { AccountStatus, AssociationResult, CsvParseResult, WidgetPhase } from '../types'

export interface ImportFile {
  name: string
  parsed: CsvParseResult
}

export interface ImportState {
  phase: WidgetPhase
  file: ImportFile | null
  rows: AccountStatus[]
  result: AssociationResult | null
  error: AccountWidgetError | null
}

export type ImportAction =
  | { type: 'FILE_ACCEPTED'; file: ImportFile }
  | { type: 'STATUS_LOADED'; rows: AccountStatus[] }
  | { type: 'SUBMIT' }
  | { type: 'SUBMIT_SUCCESS'; result: AssociationResult }
  | { type: 'FAILED'; error: AccountWidgetError }
  | { type: 'RESET' }

export const INITIAL_IMPORT_STATE: ImportState = {
  phase: 'idle',
  file: null,
  rows: [],
  result: null,
  error: null,
}

export function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case 'FILE_ACCEPTED':
      return { ...INITIAL_IMPORT_STATE, phase: 'checking', file: action.file }
    case 'STATUS_LOADED':
      if (state.phase !== 'checking') return state
      return { ...state, phase: 'review', rows: action.rows, error: null }
    case 'SUBMIT':
      if (!state.rows.some((row) => row.existe)) return state
      return { ...state, phase: 'submitting', error: null }
    case 'SUBMIT_SUCCESS':
      if (state.phase !== 'submitting') return state
      return { ...state, phase: 'success', result: action.result }
    case 'FAILED':
      // Se conservan las filas para que el usuario pueda reintentar "Continuar".
      return { ...state, phase: 'error', error: action.error }
    case 'RESET':
      return INITIAL_IMPORT_STATE
  }
}

export function useImportFlow() {
  return useReducer(importReducer, INITIAL_IMPORT_STATE)
}
