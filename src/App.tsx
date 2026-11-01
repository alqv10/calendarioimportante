import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { CalendarView } from './components/CalendarView'
import { TimelineView } from './components/TimelineView'
import { MilestonesView } from './components/MilestonesView'
import { MemoryFormModal } from './components/MemoryFormModal'
import { MemoryDetailModal } from './components/MemoryDetailModal'
import { DayMomentsModal } from './components/DayMomentsModal'
import { AuthModal } from './components/AuthModal'
import { GraceEasterEggModal } from './components/GraceEasterEggModal'
import { CloudConfigModal } from './components/CloudConfigModal'
import { CalendarPairingModal } from './components/CalendarPairingModal'
import { BottomNav } from './components/BottomNav'
import type { MemoryMoment, ViewMode, UserProfile } from './types'
import { getAllMemories, saveMemory, deleteMemory } from './services/storage'
import { getCurrentUser, logoutUser, restoreCurrentUser } from './services/auth'
import { isCloudDatabaseConnected } from './services/supabase'
import { Heart, Sparkles, Flower2 } from 'lucide-react'

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    isCloudDatabaseConnected() ? null : getCurrentUser()
  )
  const [authReady, setAuthReady] = useState(() => !isCloudDatabaseConnected())
  const [authError, setAuthError] = useState('')
  const [memories, setMemories] = useState<MemoryMoment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [currentView, setCurrentView] = useState<ViewMode>('calendar')

  // Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('momentos_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>()
  const [editingMoment, setEditingMoment] = useState<MemoryMoment | null>(null)
  const [selectedMoment, setSelectedMoment] = useState<MemoryMoment | null>(null)
  const [dayModalDate, setDayModalDate] = useState<string | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isCalendarPairingOpen, setIsCalendarPairingOpen] = useState(false)
  const [calendarPairingModalInstance, setCalendarPairingModalInstance] = useState(0)
  const [isGraceEasterEggOpen, setIsGraceEasterEggOpen] = useState(false)
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false)
  const [isCloudConnected, setIsCloudConnected] = useState(() => isCloudDatabaseConnected())

  useEffect(() => {
    let active = true
    restoreCurrentUser()
      .then(user => {
        if (!active) return
        setCurrentUser(user)
        setAuthReady(true)
        if (isCloudDatabaseConnected() && !user) setIsAuthOpen(true)
      })
      .catch((error: unknown) => {
        if (!active) return
        setAuthError(error instanceof Error ? error.message : 'No se pudo restaurar la sesión.')
        setAuthReady(true)
      })
    return () => { active = false }
  }, [])

  // Sync dark mode class on document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('momentos_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('momentos_theme', 'light')
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  // Load memories for current user
  const fetchMemories = useCallback(async () => {
    if (!authReady) return
    if (isCloudDatabaseConnected() && !currentUser) {
      setMemories([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError('')
    try {
      const data = await getAllMemories(currentUser?.id)
      setMemories(data)
    } catch (error) {
      setMemories([])
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los recuerdos.')
    } finally {
      setIsLoading(false)
    }
  }, [authReady, currentUser])

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  // Global Easter Egg Keyboard Listener: typing "grace" opens the secret modal!
  useEffect(() => {
    let typedSequence = ''
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      typedSequence += e.key.toLowerCase()
      if (typedSequence.length > 10) {
        typedSequence = typedSequence.slice(-10)
      }

      if (typedSequence.endsWith('grace')) {
        setIsGraceEasterEggOpen(true)
        typedSequence = ''
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSaveMemory = async (moment: MemoryMoment) => {
    if (
      isCloudDatabaseConnected() &&
      (!currentUser || (moment.userId && moment.userId !== currentUser.id))
    ) {
      throw new Error('Solo puedes guardar recuerdos en tu propia cuenta.')
    }
    await saveMemory(moment, currentUser?.id)
    await fetchMemories()
    if (selectedMoment?.id === moment.id) {
      setSelectedMoment(moment)
    }
  }

  const handleDeleteMemory = async (id: string) => {
    if (isCloudDatabaseConnected()) {
      const memory = memories.find(moment => moment.id === id)
      if (!currentUser || !memory || memory.userId !== currentUser.id) {
        throw new Error('Solo puedes borrar recuerdos de tu propia cuenta.')
      }
    }
    await deleteMemory(id)
    await fetchMemories()
  }

  const handleOpenNewForm = (dateStr?: string) => {
    setEditingMoment(null)
    setFormInitialDate(dateStr)
    setIsFormOpen(true)
  }

  const handleStartEdit = (moment: MemoryMoment) => {
    setEditingMoment(moment)
    setIsFormOpen(true)
  }

  const handleSelectDate = (dateStr: string) => {
    setDayModalDate(dateStr)
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      setCurrentUser(null)
      setMemories([])
      if (isCloudDatabaseConnected()) setIsAuthOpen(true)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'No se pudo cerrar la sesión.')
    }
  }

  const handleAuthSuccess = (user: UserProfile) => {
    setAuthError('')
    setCurrentUser(user)
  }

  const handleCloudConfigChanged = () => {
    const cloudConnected = isCloudDatabaseConnected()
    setIsCloudConnected(cloudConnected)
    setCurrentUser(null)
    setMemories([])
    setLoadError('')
    setAuthError('')
    setAuthReady(!cloudConnected)
    if (!cloudConnected) return

    restoreCurrentUser()
      .then(user => {
        setCurrentUser(user)
        setAuthReady(true)
        if (!user) setIsAuthOpen(true)
      })
      .catch((error: unknown) => {
        setAuthError(error instanceof Error ? error.message : 'No se pudo restaurar la sesión.')
        setAuthReady(true)
      })
  }

  const dayMoments = dayModalDate
    ? memories.filter(m => m.date === dayModalDate)
    : []

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f4] dark:bg-[#121118] text-stone-800 dark:text-stone-100 transition-colors pb-16 md:pb-0">
      
      {/* Top navigation bar */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewMoment={() => handleOpenNewForm()}
        memories={memories}
        onReload={fetchMemories}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenGraceEasterEgg={() => setIsGraceEasterEggOpen(true)}
        onOpenCloudConfig={() => setIsCloudConfigOpen(true)}
        onOpenCalendarPairing={() => {
          setCalendarPairingModalInstance(instance => instance + 1)
          setIsCalendarPairingOpen(true)
        }}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-8 py-5 sm:py-8">
        {authError && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
            {authError}
          </div>
        )}
        {loadError && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
            {loadError}
          </div>
        )}
        {isLoading || !authReady ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 rounded-lg border-4 border-rose-300 border-t-rose-600 animate-spin mb-4" />
            <p className="text-stone-500 dark:text-stone-400 font-semibold text-sm">
              Cargando momentos felices... ✨
            </p>
          </div>
        ) : (
          <>
            {currentView === 'calendar' && (
              <CalendarView
                memories={memories}
                currentUserId={currentUser?.id}
                onSelectDate={handleSelectDate}
                onSelectMoment={setSelectedMoment}
                onAddMomentForDate={handleOpenNewForm}
              />
            )}

            {currentView === 'timeline' && (
              <TimelineView
                memories={memories}
                onSelectMoment={setSelectedMoment}
                onNewMoment={() => handleOpenNewForm()}
              />
            )}

            {currentView === 'milestones' && (
              <MilestonesView
                memories={memories}
                onSelectMoment={setSelectedMoment}
                onNewMoment={() => handleOpenNewForm()}
                currentUser={currentUser}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-[#15131c]/70 py-6 text-center text-xs text-stone-500 dark:text-stone-400 transition-colors">
        <div className="flex flex-wrap items-center justify-center gap-1.5 font-medium">
          <span>Hecho con</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline animate-bounce" />
          <span>para guardar cada instante especial</span>
          <Sparkles className="w-3 h-3 text-amber-500 inline" />
          <button
            onClick={() => setIsGraceEasterEggOpen(true)}
            title="✨"
            className="text-stone-300 dark:text-stone-700 hover:text-rose-400 dark:hover:text-rose-400 transition-colors cursor-pointer ml-1"
          >
            <Flower2 className="w-3 h-3 inline" />
          </button>
        </div>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
          Guarda tus fotos, música y lugares en cualquier pantalla.
        </p>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewMoment={() => handleOpenNewForm()}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Modals */}
      <MemoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveMemory}
        initialDate={formInitialDate}
        initialData={editingMoment}
      />

      <MemoryDetailModal
        moment={selectedMoment}
        onClose={() => setSelectedMoment(null)}
        onEdit={handleStartEdit}
        onDelete={handleDeleteMemory}
        canEdit={
          !isCloudConnected ||
          (!!currentUser && selectedMoment?.userId === currentUser.id)
        }
      />

      <DayMomentsModal
        isOpen={!!dayModalDate}
        onClose={() => setDayModalDate(null)}
        dateStr={dayModalDate || ''}
        moments={dayMoments}
        currentUserId={currentUser?.id}
        onSelectMoment={setSelectedMoment}
        onAddNew={handleOpenNewForm}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <CalendarPairingModal
        key={calendarPairingModalInstance}
        isOpen={isCalendarPairingOpen}
        currentUser={currentUser}
        onClose={() => setIsCalendarPairingOpen(false)}
        onPairingChanged={() => { void fetchMemories() }}
      />

      <GraceEasterEggModal
        isOpen={isGraceEasterEggOpen}
        onClose={() => setIsGraceEasterEggOpen(false)}
      />

      <CloudConfigModal
        isOpen={isCloudConfigOpen}
        onClose={() => setIsCloudConfigOpen(false)}
        onConfigChanged={handleCloudConfigChanged}
      />

    </div>
  )
}

export default App
