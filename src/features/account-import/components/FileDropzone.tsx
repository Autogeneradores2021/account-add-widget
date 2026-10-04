import { useId, useState, type ChangeEvent, type DragEvent } from 'react'
import { useWidgetContext } from '../widgetContext'

interface FileDropzoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

export function FileDropzone({ onFile, disabled = false }: FileDropzoneProps) {
  const { options } = useWidgetContext()
  const { texts } = options
  const inputId = useId()
  const hintId = useId()
  const [isDragging, setIsDragging] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Limpia el valor para poder volver a elegir el mismo archivo.
    event.target.value = ''
    if (file) onFile(file)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (!disabled && file) onFile(file)
  }

  const className = ['aw-dropzone', isDragging && 'aw-dropzone--active'].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        id={inputId}
        className="aw-visually-hidden"
        type="file"
        accept=".csv,text/csv"
        aria-describedby={hintId}
        disabled={disabled}
        onChange={handleChange}
        data-autofocus
      />
      <label htmlFor={inputId} className="aw-dropzone__label">
        <span className="aw-dropzone__icon" aria-hidden="true">⬆</span>
        <span>
          {texts.dropzoneLabel} <span className="aw-link">{texts.dropzoneAction}</span>
        </span>
      </label>
      <p id={hintId} className="aw-dropzone__hint">
        {texts.dropzoneHint} {options.maxFileSizeKb} KB.
      </p>
    </div>
  )
}
