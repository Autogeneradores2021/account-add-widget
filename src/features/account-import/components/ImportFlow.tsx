import { useEffect } from 'react'
import { Button } from '../../../components/Button'
import { Spinner } from '../../../components/Spinner'
import { useAccountStatus } from '../hooks/useAccountStatus'
import { useAssociateAccounts } from '../hooks/useAssociateAccounts'
import { useImportFlow } from '../hooks/useImportFlow'
import { parseNiuCsv } from '../lib/parseNiuCsv'
import { readFileAsText } from '../lib/readFileAsText'
import { validateCsvFile, validateParseResult } from '../lib/validateImport'
import { AccountWidgetError, toWidgetError } from '../lib/widgetError'
import type { AssociationResult, WidgetPhase } from '../types'
import { useWidgetContext } from '../widgetContext'
import { FileDropzone } from './FileDropzone'
import { ImportFeedback } from './ImportFeedback'
import { ImportSummary } from './ImportSummary'
import { StatusTable } from './StatusTable'

interface ImportFlowProps {
  titleId: string
  onClose: () => void
  onPhaseChange: (phase: WidgetPhase, error: AccountWidgetError | null) => void
}

export function ImportFlow({ titleId, onClose, onPhaseChange }: ImportFlowProps) {
  const { options, events } = useWidgetContext()
  const { texts } = options
  const [state, dispatch] = useImportFlow()
  const statusMutation = useAccountStatus()
  const associateMutation = useAssociateAccounts()

  // Sincroniza la fase con el controlador del widget (API imperativa del host).
  useEffect(() => {
    onPhaseChange(state.phase, state.error)
  }, [state.phase, state.error, onPhaseChange])

  const { phase, rows, file, error } = state
  const existing = rows.filter((row) => row.existe)
  const hasRows = rows.length > 0
  const isBusy = phase === 'checking' || phase === 'submitting'
  const canContinue = existing.length > 0 && (phase === 'review' || (phase === 'error' && hasRows))

  function fail(widgetError: AccountWidgetError) {
    dispatch({ type: 'FAILED', error: widgetError })
    events.emit('error', widgetError)
  }

  async function handleFile(selected: File) {
    const fileError = validateCsvFile(selected, options.maxFileSizeKb)
    if (fileError) return fail(fileError)

    let text: string
    try {
      text = await readFileAsText(selected)
    } catch (cause) {
      return fail(new AccountWidgetError('CSV_INVALID', 'No fue posible leer el archivo.', { cause }))
    }

    const parsed = parseNiuCsv(text)
    const parseError = validateParseResult(parsed, options.maxRows)
    if (parseError) return fail(parseError)

    dispatch({ type: 'FILE_ACCEPTED', file: { name: selected.name, parsed } })
    events.emit('fileParsed', parsed)
    statusMutation.mutate(parsed.nius, {
      onSuccess: (statusRows) => {
        dispatch({ type: 'STATUS_LOADED', rows: statusRows })
        events.emit('statusLoaded', statusRows)
      },
      onError: (cause) => fail(toWidgetError(cause)),
    })
  }

  function handleContinue() {
    if (!canContinue) return
    const associated = existing.map((row) => row.niu)
    const skipped = rows.filter((row) => !row.existe).map((row) => row.niu)
    dispatch({ type: 'SUBMIT' })
    associateMutation.mutate(associated, {
      onSuccess: (response) => {
        const result: AssociationResult = { email: options.email, associated, skipped, response }
        dispatch({ type: 'SUBMIT_SUCCESS', result })
        events.emit('success', result)
        events.emit('complete', { status: 'success', result })
      },
      onError: (cause) => fail(toWidgetError(cause)),
    })
  }

  return (
    <div className="aw-flow" aria-busy={isBusy}>
      <header className="aw-modal__header">
        <h2 id={titleId} className="aw-modal__title">
          {texts.title}
        </h2>
        <button
          type="button"
          className="aw-icon-btn"
          aria-label={texts.close}
          onClick={onClose}
          disabled={phase === 'submitting'}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="aw-modal__body">
        {phase === 'success' ? (
          <ImportFeedback kind="success" message={texts.success} />
        ) : (
          <>
            {!hasRows && phase !== 'checking' && <FileDropzone onFile={handleFile} />}
            {phase === 'checking' && <Spinner label={texts.checking} />}
            {error && <ImportFeedback kind="error" message={error.message} />}
            {hasRows && file && (
              <>
                <ImportSummary file={file} rows={rows} />
                <StatusTable rows={rows} />
                {existing.length === 0 && <p className="aw-note aw-note--warning">{texts.noExisting}</p>}
              </>
            )}
            {phase === 'submitting' && <Spinner label={texts.submitting} />}
          </>
        )}
      </div>

      <footer className="aw-modal__footer">
        {hasRows && phase !== 'success' && (
          <Button variant="secondary" onClick={() => dispatch({ type: 'RESET' })} disabled={isBusy}>
            {texts.reload}
          </Button>
        )}
        <Button variant="secondary" onClick={onClose} disabled={phase === 'submitting'}>
          {phase === 'success' ? texts.close : texts.cancel}
        </Button>
        {phase !== 'success' && (
          <Button onClick={handleContinue} disabled={!canContinue}>
            {texts.continue}
            {existing.length > 0 && ` (${existing.length})`}
          </Button>
        )}
      </footer>
    </div>
  )
}
