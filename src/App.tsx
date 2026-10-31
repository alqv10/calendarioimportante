import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { CalendarView } from './components/CalendarView'
import { TimelineView } from './components/TimelineView'
import { MilestonesView } from './components/MilestonesView'
import { MemoryFormModal } from './components/MemoryFormModal'
import { MemoryDetailModal } from './components/MemoryDetailModal'
import { DayMomentsModal } from './components/DayMomentsModal'
import type { MemoryMoment, ViewMode } from './types'
import { getAllMemories, saveMemory, deleteMemory } from './services/storage'
import { Heart, Sparkles } from 'lucide-react'

export function App() {
  const [memories, setMemories] = useState<MemoryMoment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewMode>('calendar')

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>()
  const [editingMoment, setEditingMoment] = useState<MemoryMoment | null>(null)

  const [selectedMoment, setSelectedMoment] = useState<MemoryMoment | null>(null)
  const [dayModalDate, setDayModalDate] = useState<string | null>(null)

  const fetchMemories = async () => {
    setIsLoading(true)
    try {
      const data = await getAllMemories()
      setMemories(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [])

  const handleSaveMemory = async (moment: MemoryMoment) => {
    await saveMemory(moment)
    await fetchMemories()
    // If the saved moment was currently open in detail modal, update it
    if (selectedMoment?.id === moment.id) {
      setSelectedMoment(moment)
    }
  }

  const handleDeleteMemory = async (id: string) => {
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

  const dayMoments = dayModalDate
    ? memories.filter(m => m.date === dayModalDate)
    : []

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f4] text-stone-800">
      
      {/* Top cheerful navigation bar */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewMoment={() => handleOpenNewForm()}
        memories={memories}
        onReload={fetchMemories}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 rounded-full border-4 border-rose-300 border-t-rose-600 animate-spin mb-4" />
            <p className="text-stone-500 font-semibold text-sm">
              Cargando momentos felices... ✨
            </p>
          </div>
        ) : (
          <>
            {currentView === 'calendar' && (
              <CalendarView
                memories={memories}
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
              />
            )}
          </>
        )}
      </main>

      {/* Joyful Footer */}
      <footer className="border-t border-stone-200/80 bg-white/70 py-6 text-center text-xs text-stone-500">
        <div className="flex items-center justify-center gap-1.5 font-medium">
          <span>Hecho con</span>
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline animate-bounce" />
          <span>para guardar cada instante que nos hace sonreír</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500 inline" />
        </div>
        <p className="text-[11px] text-stone-400 mt-1">
          Tus recuerdos y fotos se guardan en tu navegador de forma 100% privada y segura.
        </p>
      </footer>

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
      />

      <DayMomentsModal
        isOpen={!!dayModalDate}
        onClose={() => setDayModalDate(null)}
        dateStr={dayModalDate || ''}
        moments={dayMoments}
        onSelectMoment={setSelectedMoment}
        onAddNew={handleOpenNewForm}
      />

    </div>
  )
}

export default App
