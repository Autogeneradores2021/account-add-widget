import { describe, expect, it } from 'vitest'
import { AccountWidgetError } from '../lib/widgetError'
import { INITIAL_IMPORT_STATE, importReducer, type ImportState } from './useImportFlow'

const file = { name: 'a.csv', parsed: { nius: ['1', '2'], invalidValues: [], duplicates: 0, headerSkipped: false } }
const rows = [
  { niu: '1', existe: true, direccion: null, propietario: null },
  { niu: '2', existe: false, direccion: null, propietario: null },
]

function review(): ImportState {
  const checking = importReducer(INITIAL_IMPORT_STATE, { type: 'FILE_ACCEPTED', file })
  return importReducer(checking, { type: 'STATUS_LOADED', rows })
}

describe('importReducer', () => {
  it('recorre el flujo feliz hasta success', () => {
    const submitting = importReducer(review(), { type: 'SUBMIT' })
    expect(submitting.phase).toBe('submitting')
    const result = { email: 'a@b.co', associated: ['1'], skipped: ['2'], response: null }
    const done = importReducer(submitting, { type: 'SUBMIT_SUCCESS', result })
    expect(done).toMatchObject({ phase: 'success', result })
  })

  it('no permite enviar si ninguna cuenta existe', () => {
    const state = { ...review(), rows: [rows[1]] }
    expect(importReducer(state, { type: 'SUBMIT' })).toBe(state)
  })

  it('conserva las filas al fallar para poder reintentar', () => {
    const error = new AccountWidgetError('HTTP')
    const failed = importReducer(importReducer(review(), { type: 'SUBMIT' }), { type: 'FAILED', error })
    expect(failed).toMatchObject({ phase: 'error', error, rows })
    expect(importReducer(failed, { type: 'SUBMIT' }).phase).toBe('submitting')
  })

  it('ignora resultados de estado que llegan fuera de la fase de consulta', () => {
    expect(importReducer(INITIAL_IMPORT_STATE, { type: 'STATUS_LOADED', rows })).toBe(INITIAL_IMPORT_STATE)
  })

  it('vuelve al estado inicial con RESET', () => {
    expect(importReducer(review(), { type: 'RESET' })).toBe(INITIAL_IMPORT_STATE)
  })
})
