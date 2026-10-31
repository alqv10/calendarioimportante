import { useRef } from 'react'
import { Calendar, BookOpen, Sparkles, Plus, Download, Upload, Heart } from 'lucide-react'
import type { ViewMode, MemoryMoment } from '../types'
import { exportMemoriesJSON, importMemoriesJSON } from '../services/storage'
import { triggerJoyfulConfetti } from '../services/confetti'

interface HeaderProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  onNewMoment: () => void
  memories: MemoryMoment[]
  onReload: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onNewMoment,
  memories,
  onReload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      const dataStr = await exportMemoriesJSON()
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recuerdos-importantes-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      triggerJoyfulConfetti()
    } catch (err) {
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
        const count = await importMemoriesJSON(text)
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
    <header className="sticky top-0 z-30 bg-[#fcfaf7]/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-rose-500/20 transform transition-transform hover:scale-105">
              <Heart className="w-6 h-6 fill-white stroke-white animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-sans">
                Momentos <span className="text-rose-500 font-extrabold">Especiales</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                <span>✨ {memories.length} recuerdos</span>
                {totalPhotos > 0 && <span>• 📸 {totalPhotos} fotos</span>}
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              El calendario de los días que hicieron historia en nuestros corazones
            </p>
          </div>
        </div>

        {/* View Switcher Navigation */}
        <div className="flex items-center bg-stone-100/80 p-1 rounded-2xl border border-stone-200/70 shadow-inner">
          <button
            onClick={() => onViewChange('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentView === 'calendar'
                ? 'bg-white text-stone-900 shadow-sm shadow-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Calendar className="w-4 h-4 text-rose-500" />
            <span>Calendario</span>
          </button>

          <button
            onClick={() => onViewChange('timeline')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentView === 'timeline'
                ? 'bg-white text-stone-900 shadow-sm shadow-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>Álbum</span>
          </button>

          <button
            onClick={() => onViewChange('milestones')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentView === 'milestones'
                ? 'bg-white text-stone-900 shadow-sm shadow-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Hitos & Días</span>
            {totalMilestones > 0 && (
              <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {totalMilestones}
              </span>
            )}
          </button>
        </div>

        {/* Actions: Add Moment & Backup */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleExport}
            title="Exportar copia de seguridad (JSON con fotos)"
            className="p-2 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleImportClick}
            title="Importar recuerdos guardados"
            className="p-2 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-transparent hover:border-amber-200"
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            onClick={onNewMoment}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md shadow-rose-500/25 transform transition hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="font-semibold">Nuevo Recuerdo</span>
          </button>
        </div>

      </div>
    </header>
  )
}
