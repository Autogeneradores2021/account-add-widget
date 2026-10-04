import { useEffect, useRef, type ReactNode, type SyntheticEvent } from 'react'

interface ModalProps {
  open: boolean
  labelledBy: string
  onClose: () => void
  children: ReactNode
}

/**
 * Diálogo modal nativo: foco atrapado, Esc y top-layer los gestiona el navegador.
 * El foco inicial va al elemento con `data-autofocus`; al cerrar vuelve al elemento previo.
 */
export function Modal({ open, labelledBy, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog || dialog.open) return

    // getRootNode() para que funcione también dentro de Shadow DOM.
    const root = dialog.getRootNode() as Document | ShadowRoot
    const previouslyFocused = root.activeElement
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => {
      if (dialog.open) dialog.close()
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open])

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    onClose()
  }

  return (
    <dialog ref={dialogRef} className="aw-modal" aria-labelledby={labelledBy} onCancel={handleCancel}>
      {open && children}
    </dialog>
  )
}
