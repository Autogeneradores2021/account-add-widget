import { describe, expect, it } from 'vitest'
import { parseNiuCsv } from './parseNiuCsv'
import { validateCsvFile, validateParseResult } from './validateImport'

const file = (content: string, name = 'a.csv') => new File([content], name)

describe('validateCsvFile', () => {
  it('acepta archivos .csv dentro del límite', () => {
    expect(validateCsvFile(file('1'), 1)).toBeNull()
    expect(validateCsvFile(file('1', 'DATOS.CSV'), 1)).toBeNull()
  })

  it('rechaza otras extensiones, archivos vacíos y archivos grandes', () => {
    expect(validateCsvFile(file('1', 'a.xlsx'), 1)?.code).toBe('FILE_TYPE')
    expect(validateCsvFile(file(''), 1)?.code).toBe('CSV_EMPTY')
    expect(validateCsvFile(file('1'.repeat(2048)), 1)?.code).toBe('FILE_TOO_LARGE')
  })
})

describe('validateParseResult', () => {
  it('diferencia archivo vacío de archivo sin NIU válidos', () => {
    expect(validateParseResult(parseNiuCsv(''), 10)?.code).toBe('CSV_EMPTY')
    expect(validateParseResult(parseNiuCsv('1x\n2y'), 10)?.code).toBe('CSV_INVALID')
  })

  it('rechaza más NIU que el máximo permitido', () => {
    expect(validateParseResult(parseNiuCsv('1\n2\n3'), 2)?.code).toBe('TOO_MANY_ROWS')
    expect(validateParseResult(parseNiuCsv('1\n2'), 2)).toBeNull()
  })
})
