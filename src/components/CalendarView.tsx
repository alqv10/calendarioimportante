import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, MapPin, Sparkles } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment } from '../types'
import { generateCalendarMonth, MONTH_NAMES_ES, DAY_NAMES_ES, formatDateSpanish } from '../utils/dateUtils'

interface CalendarViewProps {
  memories: MemoryMoment[]
  onSelectDate: (dateStr: string) => void
  onSelectMoment: (moment: MemoryMoment) => void
  onAddMomentForDate: (dateStr: string) => void
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  memories,
  onSelectDate,
  onSelectMoment,
  onAddMomentForDate,
}) => {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth())

  const momentsByDate = useMemo(() => {
    const map = new Map<string, MemoryMoment[]>()
    for (const m of memories) {
      const existing = map.get(m.date) || []
      existing.push(m)
      map.set(m.date, existing)
    }
    return map
  }, [memories])

  const calendarDays = useMemo(() => {
    return generateCalendarMonth(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const handleToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
  const monthMemories = memories.filter(m => m.date.startsWith(currentMonthPrefix))

  return (
    <div className="space-y-6">
      {/* Month Navigation & Bar */}
      <div className="bg-white/95 dark:bg-[#181620]/95 backdrop-blur rounded-2xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center font-bold border border-rose-100 dark:border-rose-900/40">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight font-sans">
                {MONTH_NAMES_ES[currentMonth]}{' '}
                <span className="text-rose-500 font-light">{currentYear}</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {monthMemories.length === 0
                  ? 'Sin momentos registrados en este mes aún'
                  : `${monthMemories.length} ${monthMemories.length === 1 ? 'momento especial guardado' : 'momentos especiales guardados'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-0.5 border border-stone-200/60 dark:border-stone-700">
              <button
                onClick={handlePrevMonth}
                title="Mes anterior"
                className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                title="Mes siguiente"
                className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-6 text-center">
          {DAY_NAMES_ES.map((dayName, idx) => {
            const isWeekend = idx === 0 || idx === 6
            return (
              <div
                key={dayName}
                className={`py-1.5 text-xs font-bold tracking-wider uppercase ${
                  isWeekend ? 'text-rose-500 font-extrabold' : 'text-stone-400 dark:text-stone-500'
                }`}
              >
                {dayName}
              </div>
            )
          })}
        </div>

        {/* Calendar Grid (Crisp geometric corners) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-2">
          {calendarDays.map((day, idx) => {
            const dayMoments = momentsByDate.get(day.dateString) || []
            const hasMoments = dayMoments.length > 0
            const hasMilestone = dayMoments.some(m => m.isMilestone || m.category === 'aniversario')
            const primaryMoment = dayMoments[0]
            const firstPhoto = primaryMoment?.photos?.[0]

            return (
              <div
                key={idx}
                onClick={() => {
                  if (hasMoments) {
                    onSelectDate(day.dateString)
                  } else {
                    onAddMomentForDate(day.dateString)
                  }
                }}
                className={`group relative min-h-[85px] sm:min-h-[105px] md:min-h-[115px] rounded-xl p-1.5 sm:p-2 border transition-all cursor-pointer flex flex-col justify-between select-none ${
                  !day.isCurrentMonth
                    ? 'bg-stone-50/40 dark:bg-stone-900/20 border-dashed border-stone-200/50 dark:border-stone-800/40 text-stone-300 dark:text-stone-700 opacity-50'
                    : day.isToday
                    ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-1 ring-rose-300 dark:ring-rose-800 shadow-xs'
                    : hasMilestone
                    ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-xs hover:border-amber-400'
                    : hasMoments
                    ? 'bg-white dark:bg-[#1e1c26] border-rose-200 dark:border-rose-900/60 shadow-xs hover:border-rose-400'
                    : 'bg-white/60 dark:bg-[#191722]/60 border-stone-200/70 dark:border-stone-800/80 hover:bg-stone-50/80 dark:hover:bg-stone-800/50 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* Top of day cell */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold w-5 h-5 rounded-md transition-colors ${
                      day.isToday
                        ? 'bg-rose-500 text-white shadow-xs'
                        : hasMilestone
                        ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 font-extrabold'
                        : hasMoments
                        ? 'text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-800 font-bold'
                        : day.isCurrentMonth
                        ? 'text-stone-700 dark:text-stone-300'
                        : 'text-stone-400 dark:text-stone-600'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Indicators */}
                  {hasMilestone && (
                    <span title="¡Hito o Aniversario especial!" className="text-amber-500 text-xs animate-bounce">
                      ✨
                    </span>
                  )}
                  {hasMoments && !hasMilestone && (
                    <span className="text-rose-500 text-[11px]">
                      💖
                    </span>
                  )}
                </div>

                {/* Day content: Preview photo or emoji & moment titles */}
                <div className="mt-1 flex-1 flex flex-col justify-end">
                  {hasMoments ? (
                    <div className="space-y-1">
                      {firstPhoto ? (
                        <div className="relative w-full h-8 sm:h-11 rounded-lg overflow-hidden shadow-xs border border-white dark:border-stone-700">
                          <img
                            src={firstPhoto.url}
                            alt={primaryMoment.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {dayMoments.length > 1 && (
                            <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-[9px] font-bold text-white px-1 rounded-sm backdrop-blur-xs">
                              +{dayMoments.length}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-1 rounded-lg bg-stone-50/90 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 transition-colors">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-800 dark:text-stone-200 truncate">
                            <span>{primaryMoment.emoji}</span>
                            <span className="truncate hidden sm:inline">{primaryMoment.title}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center py-0.5">
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-0.5 font-medium">
                        <Plus className="w-3 h-3" /> Añadir
                      </span>
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      </div>

      {/* Highlights of Current Month */}
      {monthMemories.length > 0 && (
        <div className="bg-white/90 dark:bg-[#181620]/90 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Recuerdos de este mes ({MONTH_NAMES_ES[currentMonth]})
            </h3>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Toca cualquier tarjeta para ver detalles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthMemories.map(moment => {
              const cat = CATEGORIES[moment.category] || CATEGORIES.otro
              const photo = moment.photos?.[0]

              return (
                <div
                  key={moment.id}
                  onClick={() => onSelectMoment(moment)}
                  className="group bg-gradient-to-b from-stone-50/50 to-white dark:from-stone-900/40 dark:to-[#1a1822] rounded-xl p-4 border border-stone-200 dark:border-stone-800 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    {photo ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
                        <img
                          src={photo.url}
                          alt={moment.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-xl flex-shrink-0">
                        {moment.emoji}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cat.badgeBg} ${cat.darkBadgeBg}`}>
                          {cat.label}
                        </span>
                        {moment.isMilestone && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            ⭐ Hito
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate group-hover:text-rose-500 transition-colors">
                        {moment.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {formatDateSpanish(moment.date)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-3 line-clamp-2 italic font-serif">
                    "{moment.description}"
                  </p>

                  {moment.location && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{moment.location}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
