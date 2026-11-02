import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, MapPin, Sparkles, Image as ImageIcon, Link2 } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment } from '../types'
import { generateCalendarMonth, MONTH_NAMES_ES, DAY_NAMES_ES, formatDateSpanish } from '../utils/dateUtils'

interface CalendarViewProps {
  memories: MemoryMoment[]
  onSelectDate: (dateStr: string) => void
  onSelectMoment: (moment: MemoryMoment) => void
  onAddMomentForDate: (dateStr: string) => void
  currentUserId?: string
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  memories,
  onSelectDate,
  onSelectMoment,
  onAddMomentForDate,
  currentUserId
}) => {
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth())

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
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
  }

  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
  const monthMemories = memories.filter(m => m.date.startsWith(currentMonthPrefix))

  return (
    <div className="space-y-6">
      {/* Month Navigation & Bar */}
      <div className="bg-white/95 dark:bg-[#181620]/95 backdrop-blur rounded-2xl p-4 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
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
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-5 text-center">
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

        {/* Calendar Grid with Glassmorphism Photo Effect */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-2">
          {calendarDays.map((day, idx) => {
            const dayMoments = momentsByDate.get(day.dateString) || []
            const hasMoments = dayMoments.length > 0
            const hasMilestone = dayMoments.some(m => m.isMilestone || m.category === 'aniversario')
            const primaryMoment = dayMoments[0]
            const firstPhoto = primaryMoment?.photos?.[0]
            const totalDayPhotos = dayMoments.reduce((acc, m) => acc + (m.photos?.length || 0), 0)
            const hasSharedMoments = dayMoments.some(moment =>
              !!currentUserId && !!moment.userId && moment.userId !== currentUserId
            )

            return (
              <button
                key={idx}
                type="button"
                aria-label={
                  hasMoments
                    ? `${formatDateSpanish(day.dateString)}: ${dayMoments.length} ${dayMoments.length === 1 ? 'recuerdo' : 'recuerdos'}`
                    : `${formatDateSpanish(day.dateString)}: añadir recuerdo`
                }
                aria-current={day.isToday ? 'date' : undefined}
                onClick={() => {
                  if (hasMoments) {
                    onSelectDate(day.dateString)
                  } else {
                    onAddMomentForDate(day.dateString)
                  }
                }}
                className={`group relative aspect-square sm:aspect-auto sm:min-h-[110px] md:min-h-[125px] rounded-xl p-1.5 sm:p-2 border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-stone-900 ${
                  !day.isCurrentMonth
                    ? 'bg-stone-50/40 dark:bg-stone-900/20 border-dashed border-stone-200/50 dark:border-stone-800/40 text-stone-300 dark:text-stone-700 opacity-40'
                    : day.isToday
                    ? 'ring-2 ring-rose-400 dark:ring-rose-500 shadow-sm border-rose-400'
                    : hasMilestone
                    ? 'border-amber-400 dark:border-amber-600 shadow-sm hover:border-amber-500'
                    : hasMoments
                    ? 'border-rose-300/80 dark:border-rose-900/70 shadow-sm hover:border-rose-500'
                    : 'bg-white/70 dark:bg-[#191722]/60 border-stone-200/70 dark:border-stone-800/80 hover:bg-stone-50/80 dark:hover:bg-stone-800/50 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* 🌟 Glassmorphism Background with Photo Backdrop */}
                {firstPhoto && (
                  <>
                    <img
                      src={firstPhoto.url}
                      alt={primaryMoment.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    {/* Degradado solo donde apoya el texto: la foto queda legible */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/25 pointer-events-none" />
                  </>
                )}

                {/* Top of day cell */}
                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold w-5 h-5 rounded-md transition-colors ${
                      day.isToday
                        ? 'bg-rose-500 text-white shadow-xs'
                        : firstPhoto
                        ? 'bg-black/50 text-white backdrop-blur-md border border-white/20 font-black'
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
                  <div className="flex items-center gap-1">
                    {hasMilestone && (
                      <span title="Hito especial" className="text-amber-400 drop-shadow-sm text-xs animate-bounce">
                        ✨
                      </span>
                    )}
                    {hasSharedMoments && (
                      <span
                        title="Hay recuerdos de la cuenta emparejada"
                        aria-label="Hay recuerdos compartidos"
                        className="inline-flex"
                      >
                        <Link2 aria-hidden="true" className="w-3 h-3 text-sky-500" />
                      </span>
                    )}
                    {totalDayPhotos > 0 && !hasMilestone && (
                      <span className="text-[10px] text-rose-500 drop-shadow-xs flex items-center gap-0.5">
                        <ImageIcon className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Day content: Glassmorphic memory pill */}
                <div className="relative z-10 mt-1 flex-1 flex flex-col justify-end">
                  {hasMoments ? (
                    <div className="space-y-1">
                      {firstPhoto ? (
                        <div className="px-0.5 text-white">
                          <div className="flex items-center gap-1 text-[10px] font-bold truncate drop-shadow-md">
                            <span>{primaryMoment.emoji}</span>
                            <span className="truncate hidden sm:inline">{primaryMoment.title}</span>
                          </div>
                          {totalDayPhotos > 1 && (
                            <span className="hidden sm:block text-[9px] font-semibold text-white/85 drop-shadow-md mt-0.5">
                              📸 {totalDayPhotos} fotos
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="p-1 rounded-lg bg-stone-100/90 dark:bg-stone-800/90 backdrop-blur-xs border border-stone-200/80 dark:border-stone-700 group-hover:border-rose-400 transition-colors">
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

              </button>
            )
          })}
        </div>
      </div>

      {/* Highlights of Current Month */}
      {monthMemories.length > 0 && (
        <div className="bg-white/90 dark:bg-[#181620]/90 rounded-2xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Recuerdos de este mes ({MONTH_NAMES_ES[currentMonth]})
            </h3>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Toca para ver o escuchar
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
                  className="group relative overflow-hidden rounded-xl p-4 bg-white dark:bg-[#191722] border border-stone-200 dark:border-stone-800 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative z-10">
                    <div className="flex items-start gap-3">
                      {photo ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700 shadow-xs">
                          <img
                            src={photo.url}
                            alt={moment.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                          <button
                            type="button"
                            onClick={event => { event.stopPropagation(); onSelectMoment(moment) }}
                            className="max-w-full truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-stone-900 rounded-sm cursor-pointer"
                          >
                            {moment.title}
                          </button>
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {formatDateSpanish(moment.date)}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 dark:text-stone-300 mt-3 line-clamp-2 italic font-serif">
                      "{moment.description}"
                    </p>
                  </div>

                  {moment.location && (
                    <div className="relative z-10 mt-2.5 pt-2 border-t border-stone-200/50 dark:border-stone-800 flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 truncate">
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
