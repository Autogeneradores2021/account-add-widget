import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useId, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Modal } from '../components/Modal'
import {
  AccountWidgetError,
  AssociateButton,
  ImportFlow,
  WidgetContext,
  type ResolvedOptions,
  type WidgetEvents,
  type WidgetPhase,
} from '../features/account-import'

export interface WidgetHandle {
  open(): void
  close(reason?: 'user' | 'api'): void
  reset(): void
  getState(): WidgetPhase
}

interface WidgetRootProps {
  options: ResolvedOptions
  events: WidgetEvents
  queryClient: QueryClient
  ref?: Ref<WidgetHandle>
}

interface FlowSnapshot {
  phase: WidgetPhase
  error: AccountWidgetError | null
}

const IDLE: FlowSnapshot = { phase: 'idle', error: null }

export function WidgetRoot({ options, events, queryClient, ref }: WidgetRootProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [flowKey, setFlowKey] = useState(0)
  const flowRef = useRef<FlowSnapshot>(IDLE)
  const readyRef = useRef(false)
  const titleId = useId()

  useEffect(() => {
    if (readyRef.current) return
    readyRef.current = true
    events.emit('ready', undefined)
  }, [events])

  function restartFlow() {
    flowRef.current = IDLE
    setFlowKey((key) => key + 1)
  }

  function open() {
    if (isOpen) return
    setIsOpen(true)
    events.emit('open', undefined)
  }

  // Cada apertura termina con exactamente un `complete` (success | error | cancelled).
  function close(reason: 'user' | 'api' = 'user') {
    if (!isOpen) return
    const { phase, error } = flowRef.current
    if (phase === 'submitting') return

    setIsOpen(false)
    restartFlow()
    events.emit('close', { reason: phase === 'success' ? 'completed' : reason })
    if (phase === 'error' && error) events.emit('complete', { status: 'error', error })
    else if (phase !== 'success') events.emit('complete', { status: 'cancelled' })
  }

  useImperativeHandle(ref, () => ({
    open,
    close,
    reset: restartFlow,
    getState: () => flowRef.current.phase,
  }))

  const handlePhaseChange = useCallback((phase: WidgetPhase, error: AccountWidgetError | null) => {
    flowRef.current = { phase, error }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <WidgetContext value={{ options, events }}>
        <ErrorBoundary
          fallback={
            <p className="aw-feedback aw-feedback--error" role="alert">
              {options.texts.unexpected}
            </p>
          }
          onError={(error) =>
            events.emit('error', new AccountWidgetError('UNEXPECTED', options.texts.unexpected, { cause: error }))
          }
        >
          <div className="aw-root">
            <AssociateButton onClick={open} />
            <Modal open={isOpen} labelledBy={titleId} onClose={() => close('user')}>
              <ImportFlow
                key={flowKey}
                titleId={titleId}
                onClose={() => close('user')}
                onPhaseChange={handlePhaseChange}
              />
            </Modal>
          </div>
        </ErrorBoundary>
      </WidgetContext>
    </QueryClientProvider>
  )
}
