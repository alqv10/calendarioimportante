import { useState } from 'react'
import { X, UserPlus, LogIn, Heart, Lock, User, Sparkles } from 'lucide-react'
import type { UserProfile } from '../types'
import { getAllUsersLocal, loginUser, registerUser } from '../services/auth'
import { triggerJoyfulConfetti } from '../services/confetti'
import { isCloudDatabaseConnected } from '../services/supabase'

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: UserProfile) => void
}

const EMOJI_OPTIONS = ['💖', '🌹', '✨', '☕', '🐱', '💫', '🌟', '🍕', '💍', '🚀']

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regName, setRegName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [partnerName, setPartnerName] = useState('Grace')
  const [avatarEmoji, setAvatarEmoji] = useState('💖')

  const [errorMsg, setErrorMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const isCloudMode = isCloudDatabaseConnected()
  const existingUsers = isCloudMode ? [] : getAllUsersLocal()

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setStatusMsg('')
    setIsSubmitting(true)
    try {
      const user = await loginUser(loginUsername, loginPassword)
      triggerJoyfulConfetti()
      onSuccess(user)
      onClose()
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Error al iniciar sesión'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setStatusMsg('')
    if (!regName.trim() || !regUsername.trim()) {
      setErrorMsg('Por favor escribe tu nombre y un nombre de usuario.')
      return
    }
    if (isCloudMode && (!regEmail.trim() || regPassword.length < 8)) {
      setErrorMsg('Ingresa un correo y una contraseña de al menos 8 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await registerUser(
        regName,
        regUsername,
        partnerName,
        avatarEmoji,
        isCloudMode ? regEmail : undefined,
        isCloudMode ? regPassword : undefined
      )
      if (!result.user) {
        setStatusMsg(result.message || 'Confirma tu cuenta desde el correo que te enviamos.')
        return
      }
      triggerJoyfulConfetti()
      onSuccess(result.user)
      onClose()
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Error al registrar cuenta'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickSwitch = async (u: UserProfile) => {
    try {
      const logged = await loginUser(u.username)
      triggerJoyfulConfetti()
      onSuccess(logged)
      onClose()
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Error al cambiar de perfil'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#191720] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 fill-white stroke-white" />
            </div>
            <h2 className="text-xl font-bold font-sans">
              Espacio de Recuerdos
            </h2>
          </div>
          <p className="text-rose-100 text-xs">
            {tab === 'login'
              ? 'Accede a tus momentos importantes guardados'
              : 'Crea tu cuenta para organizar y guardar tus recuerdos'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#14121a]">
          <button
            onClick={() => { setTab('login'); setErrorMsg('') }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'login'
                ? 'text-rose-600 dark:text-rose-400 bg-white dark:bg-[#191720] border-b-2 border-rose-500'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            onClick={() => { setTab('register'); setErrorMsg('') }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'register'
                ? 'text-rose-600 dark:text-rose-400 bg-white dark:bg-[#191720] border-b-2 border-rose-500'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}
          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {statusMsg}
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-rose-500" />
                  {isCloudMode ? 'Correo electrónico' : 'Perfil de este equipo'}
                </label>
                <input
                  type={isCloudMode ? 'email' : 'text'}
                  required
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder={isCloudMode ? 'tu@correo.com' : 'Tu nombre de usuario'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {isCloudMode && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Conectando...' : 'Entrar a mis recuerdos'}</span>
              </button>

              {/* Existing accounts quick select */}
              {existingUsers.length > 0 && (
                <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                    Cuentas en este equipo:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingUsers.map(u => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => handleQuickSwitch(u)}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 hover:border-rose-400 text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>{u.avatarEmoji}</span>
                        <span>{u.name}</span>
                        <span className="text-stone-400">(@{u.username})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!isCloudMode && (
                <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                  Los perfiles locales solo organizan recuerdos en este navegador; no son cuentas protegidas ni se sincronizan entre dispositivos.
                </p>
              )}
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Tu Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Ej. Matheo"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {isCloudMode && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_]+"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="ej. matheo"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Contraseña (mínimo 8 caracteres) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Crea una contraseña"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Nombre de tu pareja / persona especial
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  placeholder="Ej. Grace"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {!isCloudMode && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[a-zA-Z0-9_]+"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="ej. matheo"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    Este perfil no tiene contraseña ni protege tus datos; se guarda solo en este navegador.
                  </p>
                </>
              )}

              {/* Avatar Emoji */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Elige tu ícono
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setAvatarEmoji(em)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all cursor-pointer ${
                        avatarEmoji === em
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 scale-110 shadow-xs'
                          : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 pt-2.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Creando...' : 'Crear Cuenta y Comenzar'}</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  )
}
