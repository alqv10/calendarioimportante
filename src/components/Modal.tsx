import { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  /** Ancho máximo del panel (clase Tailwind). */
  width?: string
  /** false bloquea Escape y el clic fuera (p. ej. mientras no hay sesión). */
  dismissible?: boolean
  label?: string
  children: React.ReactNode
}

/**
 * Envoltorio de modal sobre <dialog>: el navegador aporta foco atrapado,
 * cierre con Escape, fondo inerte y semántica de diálogo sin código extra.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  width = 'max-w-xl',
  dismissible = true,
  label,
  children
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) dialog.showModal()
    if (!isOpen && dialog.open) dialog.close()
    if (!isOpen) return

    // `cancel` no burbujea, así que React no lo entrega: hay que escucharlo aquí.
    const blockEscape = (event: Event) => {
      if (!dismissible) event.preventDefault()
    }
    dialog.addEventListener('cancel', blockEscape)

    // <dialog> deja scrollear la página de fondo en varios navegadores.
    // Se quita la propiedad en vez de restaurar un valor capturado: así no
    // queda bloqueada si el efecto corre dos veces.
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.removeEventListener('cancel', blockEscape)
      document.body.style.removeProperty('overflow')
    }
  }, [isOpen, dismissible])

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-transparent p-0 text-stone-800 dark:text-stone-100 backdrop:bg-black/60 backdrop:backdrop-blur-sm dark:backdrop:bg-black/80"
    >
      {isOpen && (
        <div
          onMouseDown={event => {
            if (dismissible && event.target === event.currentTarget) onClose()
          }}
          className="flex min-h-full items-center justify-center p-3 sm:p-4"
          style={{
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))'
          }}
        >
          <div
            className={`animate-fade-in relative w-full ${width} overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-[#191720]`}
          >
            {children}
          </div>
        </div>
      )}
    </dialog>
  )
}
