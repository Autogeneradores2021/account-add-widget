import type { CsvParseResult, InvalidCsvValue } from '../types'

const NIU_PATTERN = /^\d+$/
const HEADER_PATTERN = /^[\p{L}_\s]+$/u
const CELL_SEPARATOR = /[,;\t]/

function cleanCell(cell: string): string {
  return cell.trim().replace(/^"(.*)"$/, '$1').trim()
}

/**
 * Extrae NIU numéricos de un CSV. Acepta un NIU por línea (una columna) o varios
 * separados por `,` `;` o tabulación. Ignora vacíos, duplicados y un encabezado textual inicial.
 */
export function parseNiuCsv(text: string): CsvParseResult {
  const nius: string[] = []
  const seen = new Set<string>()
  const invalidValues: InvalidCsvValue[] = []
  let duplicates = 0
  let headerSkipped = false
  let isFirstValue = true

  text
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\n|\r/)
    .forEach((line, lineIndex) => {
      line.split(CELL_SEPARATOR).forEach((cell, columnIndex) => {
        const value = cleanCell(cell)
        if (!value) return

        if (isFirstValue) {
          isFirstValue = false
          if (HEADER_PATTERN.test(value)) {
            headerSkipped = true
            return
          }
        }

        if (!NIU_PATTERN.test(value)) {
          invalidValues.push({ line: lineIndex + 1, column: columnIndex + 1, value })
          return
        }
        if (seen.has(value)) {
          duplicates += 1
          return
        }
        seen.add(value)
        nius.push(value)
      })
    })

  return { nius, invalidValues, duplicates, headerSkipped }
}
