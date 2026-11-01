import { useRef, useState } from 'react'
import { Calendar, BookOpen, Sparkles, Plus, Download, Upload, Heart, Sun, Moon, LogOut, User, Database, UsersRound } from 'lucide-react'
import type { ViewMode, MemoryMoment, UserProfile } from '../types'
import { exportMemoriesJSON, importMemoriesJSON } from '../services/storage'
import { triggerJoyfulConfetti } from '../services/confetti'

interface HeaderProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  onNewMoment: () => void
  memories: MemoryMoment[]
  onReload: () => void
  currentUser: UserProfile | null
  onOpenAuth: () => void
  onLogout: () => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onOpenGraceEasterEgg: () => void
  onOpenCloudConfig: () => void
  onOpenCalendarPairing: () => void
  isCloudConnected: boolean
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onNewMoment,
  memories,
  onReload,
  currentUser,
  onOpenAuth,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  onOpenGraceEasterEgg,
  onOpenCloudConfig,
  onOpenCalendarPairing,
  isCloudConnected
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoClickCount, setLogoClickCount] = useState(0)
  const lastLogoClickRef = useRef<number>(0)

  const handleLogoClick = () => {
    const now = Date.now()
    if (now - lastLogoClickRef.current < 600) {
      const nextCount = logoClickCount + 1
      if (nextCount >= 3) {
        onOpenGraceEasterEgg()
        setLogoClickCount(0)
      } else {
        setLogoClickCount(nextCount)
      }
    } else {
      setLogoClickCount(1)
    }
    lastLogoClickRef.current = now
  }

  const handleExport = async () => {
    try {
      const dataStr = await exportMemoriesJSON(currentUser?.id)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recuerdos-${currentUser?.username || 'importantes'}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      triggerJoyfulConfetti()
    } catch {
      alert('Error al exportar los recuerdos')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const count = await importMemoriesJSON(text, currentUser?.id)
        alert(`¡Se importaron ${count} recuerdos exitosamente! 💖`)
        onReload()
        triggerJoyfulConfetti()
      } catch (err: any) {
        alert(err.message || 'Error al importar archivo')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const totalPhotos = memories.reduce((acc, m) => acc + (m.photos?.length || 0), 0)
  const totalMilestones = memories.filter(m => m.isMilestone || m.category === 'aniversario' || m.category === 'cita').length

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#16141c]/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand / Logo (Secret: 3 clicks activates Easter Egg for Grace) */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/20 transform transition-transform group-hover:scale-105 active:scale-95">
              <Heart className="w-5 h-5 fill-white stroke-white animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white font-sans">
                Momentos <span className="text-rose-500 font-extrabold">Especiales</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50">
                <span>✨ {memories.length} recuerdos</span>
                {totalPhotos > 0 && <span>• 📸 {totalPhotos}</span>}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
              {currentUser?.partnerName ? (
                <>Nuestra historia de momentos junto a <strong className="text-rose-500">{currentUser.partnerName}</strong></>
              ) : (
                'El calendario de los días que cambiaron nuestra historia'
              )}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Desktop / Tablet) */}
        <div className="hidden md:flex items-center bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200/80 dark:border-stone-800">
          <button
            onClick={() => onViewChange('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentView === 'calendar'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-rose-500" />
            <span>Calendario</span>
          </button>

          <button
            onClick={() => onViewChange('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentView === 'timeline'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Álbum</span>
          </button>

          <button
            onClick={() => onViewChange('milestones')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentView === 'milestones'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Hitos</span>
            {totalMilestones > 0 && (
              <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                {totalMilestones}
              </span>
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">

          <button
            onClick={onOpenCalendarPairing}
            title="Emparejar calendarios"
            aria-label="Emparejar calendarios"
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900 cursor-pointer"
          >
            <UsersRound className="w-4 h-4" />
          </button>
          
          {/* Cloud Database Connection */}
          <button
            onClick={onOpenCloudConfig}
            title={isCloudConnected ? "Base de datos en la nube (Conectado)" : "Conectar Base de Datos en la Nube (Supabase)"}
            className={`p-2 rounded-lg transition-colors border cursor-pointer ${
              isCloudConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border-transparent hover:border-stone-200 dark:hover:border-stone-700'
            }`}
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors border border-transparent hover:border-stone-200 dark:hover:border-stone-700 cursor-pointer"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* Backup Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleExport}
            title="Exportar copia de seguridad"
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleImportClick}
            title="Importar recuerdos"
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* User Account / Profile */}
          {currentUser ? (
            <div className="flex items-center gap-1 pl-1 border-l border-stone-200 dark:border-stone-800">
              <button
                onClick={onOpenAuth}
                title={`Cuenta: ${currentUser.name} (@${currentUser.username}) - Clic para cambiar`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:border-rose-400 text-xs font-bold text-stone-800 dark:text-stone-100 transition-colors cursor-pointer"
              >
                <span>{currentUser.avatarEmoji || '💖'}</span>
                <span className="hidden lg:inline">{currentUser.name}</span>
              </button>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-2 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-rose-500" />
              <span>Cuenta</span>
            </button>
          )}

          {/* New Moment Button (Desktop) */}
          <button
            onClick={onNewMoment}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Recuerdo</span>
          </button>
        </div>

      </div>
    </header>
  )
}
