import type { ImportFile } from '../hooks/useImportFlow'
import type { AccountStatus } from '../types'

const MAX_INVALID_SHOWN = 20

interface ImportSummaryProps {
  file: ImportFile
  rows: AccountStatus[]
}

export function ImportSummary({ file, rows }: ImportSummaryProps) {
  const existing = rows.filter((row) => row.existe).length
  const { invalidValues, duplicates } = file.parsed

  return (
    <section className="aw-summary" aria-label="Resumen de la importación">
      <dl className="aw-summary__list">
        <div>
          <dt>Archivo</dt>
          <dd>{file.name}</dd>
        </div>
        <div>
          <dt>Cuentas</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Existen</dt>
          <dd>{existing}</dd>
        </div>
        <div>
          <dt>No existen</dt>
          <dd>{rows.length - existing}</dd>
        </div>
      </dl>
      {duplicates > 0 && <p className="aw-note">{duplicates} NIU duplicados fueron ignorados.</p>}
      {invalidValues.length > 0 && (
        <details className="aw-note aw-note--warning">
          <summary>
            {invalidValues.length === 1
              ? '1 valor no numérico fue ignorado'
              : `${invalidValues.length} valores no numéricos fueron ignorados`}
          </summary>
          <ul>
            {invalidValues.slice(0, MAX_INVALID_SHOWN).map((item) => (
              <li key={`${item.line}:${item.column}`}>
                Línea {item.line}: «{item.value}»
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
