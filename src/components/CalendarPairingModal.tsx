import { useEffect, useState } from 'react'
import { Copy, Link2, Unlink, UsersRound, X } from 'lucide-react'
import type { UserProfile } from '../types'
import {
  acceptCalendarPairInvite,
  createCalendarPairInvite,
  disconnectCalendarPairing,
  getCalendarPairing,
  type CalendarPairing
} from '../services/calendarPairing'
import { isCloudDatabaseConnected } from '../services/supabase'

interface CalendarPairingModalProps {
  isOpen: boolean
  currentUser: UserProfile | null
  onClose: () => void
  onPairingChanged: () => void
}

export const CalendarPairingModal: React.FC<CalendarPairingModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onPairingChanged
}) => {
  const [pairing, setPairing] = useState<CalendarPairing | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [acceptCode, setAcceptCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [isLoading, setIsLoading] = useState(() => isCloudDatabaseConnected() && !!currentUser)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canUseCloud = isCloudDatabaseConnected() && !!currentUser

  useEffect(() => {
    if (!isOpen) return
    let active = true

    if (!canUseCloud) {
      return () => { active = false }
    }

    getCalendarPairing()
      .then(result => {
        if (active) setPairing(result)
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMsg(error instanceof Error ? error.message : 'No se pudo consultar el emparejamiento.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [canUseCloud, isOpen])

  if (!isOpen) return null

  const handleCreateInvite = async () => {
    setErrorMsg('')
    setStatusMsg('')
    setIsSubmitting(true)
    try {
      setInviteCode(await createCalendarPairInvite())
      setStatusMsg('Código creado. Vence en 48 horas y solo se puede usar una vez.')
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo crear el código.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setStatusMsg('Código copiado. Envíalo en privado a la otra persona.')
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo copiar. Selecciona y copia el código manualmente.')
    }
  }

  const handleAcceptInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMsg('')
    setStatusMsg('')
    setIsSubmitting(true)
    try {
      await acceptCalendarPairInvite(acceptCode)
      setPairing(await getCalendarPairing())
      setAcceptCode('')
      setStatusMsg('¡Calendarios emparejados! Ya puedes ver sus recuerdos.')
      onPairingChanged()
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo aceptar la invitación.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('¿Desvincular los calendarios? Ambos perderán acceso a los recuerdos del otro.')) return
    setErrorMsg('')
    setStatusMsg('')
    setIsSubmitting(true)
    try {
      await disconnectCalendarPairing()
      setPairing(null)
      setInviteCode('')
      setStatusMsg('Los calendarios quedaron desvinculados.')
      onPairingChanged()
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo desvincular el calendario.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const panelClass = 'rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 p-4'
  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-pairing-title"
        className="relative w-full max-w-lg bg-white dark:bg-[#191720] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-6"
      >
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 p-6 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UsersRound className="w-5 h-5" />
            </div>
            <div>
              <h2 id="calendar-pairing-title" className="text-xl font-bold">Emparejar calendarios</h2>
              <p className="text-rose-100 text-xs">Comparte recuerdos con una cuenta de confianza</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}
          {statusMsg && (
            <div role="status" className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-sm text-emerald-700 dark:text-emerald-300">
              {statusMsg}
            </div>
          )}

          {!isCloudDatabaseConnected() ? (
            <div className={panelClass}>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                El emparejamiento requiere Supabase y cuentas cloud.
              </p>
              <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 mt-2">
                Los perfiles locales solo existen en este navegador y no se pueden vincular de forma segura.
              </p>
            </div>
          ) : !currentUser ? (
            <div className={panelClass}>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                Inicia sesión con tu cuenta cloud para emparejar calendarios.
              </p>
            </div>
          ) : isLoading ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">Consultando emparejamiento…</p>
          ) : pairing ? (
            <div className={panelClass}>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                <Link2 className="w-5 h-5" />
                <span>Calendarios emparejados</span>
              </div>
              <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 mt-2">
                Ambos pueden ver todos los recuerdos, fotos y audios. Cada persona solo puede editar o borrar los que creó.
              </p>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isSubmitting}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-50 cursor-pointer"
              >
                <Unlink className="w-4 h-4" />
                Desvincular calendarios
              </button>
            </div>
          ) : (
            <>
              <div className={panelClass}>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Invita a la otra cuenta</h3>
                <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 mt-1.5">
                  Crea un código y compártelo en privado. La otra persona deberá iniciar sesión y aceptarlo. El código vence en 48 horas y se usa una sola vez.
                </p>
                <button
                  type="button"
                  onClick={handleCreateInvite}
                  disabled={isSubmitting}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creando código…' : 'Crear código de invitación'}
                </button>
                {inviteCode && (
                  <div className="mt-3 flex gap-2">
                    <input
                      readOnly
                      value={inviteCode}
                      aria-label="Código de invitación"
                      onFocus={event => event.currentTarget.select()}
                      className={`${inputClass} font-mono text-xs`}
                    />
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      aria-label="Copiar código"
                      title="Copiar código"
                      className="shrink-0 rounded-xl border border-stone-200 dark:border-stone-700 px-3 text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleAcceptInvite} className={panelClass}>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Acepta una invitación</h3>
                <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 mt-1.5 mb-3">
                  Al emparejar, compartirán todos los recuerdos actuales y futuros. El acceso es de solo lectura y puede revocarse desde aquí.
                </p>
                <label htmlFor="pair-invite-code" className="sr-only">Código de invitación</label>
                <input
                  id="pair-invite-code"
                  required
                  maxLength={64}
                  autoComplete="off"
                  spellCheck={false}
                  value={acceptCode}
                  onChange={event => setAcceptCode(event.target.value)}
                  placeholder="Pega aquí el código de 64 caracteres"
                  className={`${inputClass} font-mono text-xs`}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-3 w-full rounded-xl border border-rose-200 dark:border-rose-900 py-2.5 text-sm font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Aceptando…' : 'Aceptar y emparejar'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
