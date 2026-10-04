import type { CsvParseResult } from '../types'
import { AccountWidgetError } from './widgetError'

const BYTES_PER_KB = 1024

export function validateCsvFile(file: File, maxFileSizeKb: number): AccountWidgetError | null {
  if (!file.name.toLowerCase().endsWith('.csv')) return new AccountWidgetError('FILE_TYPE')
  if (file.size === 0) return new AccountWidgetError('CSV_EMPTY')
  if (file.size > maxFileSizeKb * BYTES_PER_KB) {
    return new AccountWidgetError(
      'FILE_TOO_LARGE',
      `El archivo supera el tamaño máximo permitido (${maxFileSizeKb} KB).`,
    )
  }
  return null
}

export function validateParseResult(result: CsvParseResult, maxRows: number): AccountWidgetError | null {
  if (result.nius.length === 0) {
    return result.invalidValues.length > 0
      ? new AccountWidgetError('CSV_INVALID', undefined, { details: result.invalidValues })
      : new AccountWidgetError('CSV_EMPTY')
  }
  if (result.nius.length > maxRows) {
    return new AccountWidgetError(
      'TOO_MANY_ROWS',
      `El archivo tiene ${result.nius.length} cuentas; el máximo es ${maxRows}.`,
    )
  }
  return null
}
