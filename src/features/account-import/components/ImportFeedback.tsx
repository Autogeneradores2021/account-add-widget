interface ImportFeedbackProps {
  kind: 'success' | 'error'
  message: string
}

export function ImportFeedback({ kind, message }: ImportFeedbackProps) {
  return (
    <p className={`aw-feedback aw-feedback--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {message}
    </p>
  )
}
