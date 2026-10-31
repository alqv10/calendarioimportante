import React from 'react'
import { Calendar, BookOpen, Sparkles, Plus, Sun, Moon } from 'lucide-react'
import type { ViewMode } from '../types'

interface BottomNavProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  onNewMoment: () => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onViewChange,
  onNewMoment,
  isDarkMode,
  onToggleDarkMode
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#16141c]/95 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 px-3 py-2 transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Calendar */}
        <button
          onClick={() => onViewChange('calendar')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            currentView === 'calendar'
              ? 'text-rose-500 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Calendario</span>
        </button>

        {/* Timeline / Album */}
        <button
          onClick={() => onViewChange('timeline')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            currentView === 'timeline'
              ? 'text-amber-500 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Álbum</span>
        </button>

        {/* Floating Add Button */}
        <button
          onClick={onNewMoment}
          title="Añadir recuerdo"
          className="-mt-5 w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transform active:scale-95 transition-transform cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Milestones */}
        <button
          onClick={() => onViewChange('milestones')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            currentView === 'milestones'
              ? 'text-purple-500 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">Hitos</span>
        </button>

        {/* Dark Mode */}
        <button
          onClick={onToggleDarkMode}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span className="text-[10px]">{isDarkMode ? 'Claro' : 'Oscuro'}</span>
        </button>

      </div>
    </nav>
  )
}
