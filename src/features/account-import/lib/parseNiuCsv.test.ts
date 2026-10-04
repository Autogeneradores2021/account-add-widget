import { describe, expect, it } from 'vitest'
import { parseNiuCsv } from './parseNiuCsv'

describe('parseNiuCsv', () => {
  it('extrae un NIU por línea ignorando líneas vacías, BOM y CRLF', () => {
    const result = parseNiuCsv('\uFEFF123456789\r\n9876544321\r\n\r\n')
    expect(result.nius).toEqual(['123456789', '9876544321'])
    expect(result.invalidValues).toEqual([])
  })

  it('omite un encabezado textual en la primera línea', () => {
    const result = parseNiuCsv('niu\n123\n456')
    expect(result.headerSkipped).toBe(true)
    expect(result.nius).toEqual(['123', '456'])
  })

  it('acepta NIU en una sola fila separados por coma o punto y coma', () => {
    expect(parseNiuCsv('111,222;333').nius).toEqual(['111', '222', '333'])
  })

  it('reporta valores no numéricos con su línea', () => {
    const result = parseNiuCsv('123\nabc-1\n12.5\n"456"')
    expect(result.nius).toEqual(['123', '456'])
    expect(result.invalidValues).toEqual([
      { line: 2, column: 1, value: 'abc-1' },
      { line: 3, column: 1, value: '12.5' },
    ])
  })

  it('elimina duplicados conservando el orden', () => {
    const result = parseNiuCsv('3\n1\n3\n2\n1')
    expect(result.nius).toEqual(['3', '1', '2'])
    expect(result.duplicates).toBe(2)
  })

  it('conserva ceros a la izquierda', () => {
    expect(parseNiuCsv('000123').nius).toEqual(['000123'])
  })

  it('devuelve una lista vacía para un archivo vacío', () => {
    expect(parseNiuCsv('\n  \n').nius).toEqual([])
  })
})
