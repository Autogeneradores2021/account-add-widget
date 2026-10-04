interface SpinnerProps {
  label: string
}

export function Spinner({ label }: SpinnerProps) {
  return (
    <p className="aw-spinner" role="status">
      <span className="aw-spinner__icon" aria-hidden="true" />
      {label}
    </p>
  )
}
