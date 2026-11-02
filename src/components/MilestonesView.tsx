import { Sparkles, Heart, Award, MapPin, ChevronRight, PartyPopper } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment, UserProfile } from '../types'
import { getDaysTogether, formatDateSpanish, getTimeAgoSpanish } from '../utils/dateUtils'
import { triggerAnniversaryExplosion } from '../services/confetti'

interface MilestonesViewProps {
  memories: MemoryMoment[]
  onSelectMoment: (moment: MemoryMoment) => void
  onNewMoment: () => void
  currentUser?: UserProfile | null
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  memories,
  onSelectMoment,
  onNewMoment,
  currentUser
}) => {
  const sortedByDateAsc = [...memories].sort((a, b) => a.date.localeCompare(b.date))
  const firstMoment = sortedByDateAsc[0]

  const milestones = memories.filter(
    m => m.isMilestone || m.category === 'aniversario' || m.category === 'cita'
  ).sort((a, b) => a.date.localeCompare(b.date))

  const daysTogether = firstMoment ? getDaysTogether(firstMoment.date) : 0
  const partner = currentUser?.partnerName?.trim()

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Hero Banner: Total Days & Happiness Counter */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 text-white p-6 sm:p-8 shadow-xl shadow-rose-500/20">
        
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-48 h-48 rounded-full bg-amber-300/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md text-xs font-bold text-white mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {partner ? `Nuestra historia junto a ${partner}` : 'Nuestra historia de momentos'} 💖
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
              {daysTogether > 0 ? (
                <>
                  <span className="text-amber-200 font-black">{daysTogether}</span> días de momentos
                </>
              ) : (
                'Comenzando nuestra historia'
              )}
            </h2>

            <p className="text-rose-100 text-xs sm:text-sm mt-1.5 max-w-md">
              {firstMoment ? (
                <>Desde el primer recuerdo el <strong>{formatDateSpanish(firstMoment.date)}</strong> ("{firstMoment.title}").</>
              ) : (
                'Añade tu primera cita o momento especial para iniciar el contador.'
              )}
            </p>
          </div>

          <button
            onClick={() => triggerAnniversaryExplosion()}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-rose-600 hover:bg-rose-50 font-extrabold text-xs sm:text-sm shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <PartyPopper className="w-5 h-5 text-amber-500" />
            <span>¡Celebrar con Confeti!</span>
          </button>
        </div>
      </div>

      {/* Milestones Roadmap */}
      <div className="bg-white/95 dark:bg-[#181620]/95 backdrop-blur rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              Hitos Inolvidables
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Los momentos que marcaron un antes y un después
            </p>
          </div>

          <button
            onClick={onNewMoment}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-3.5 py-2 rounded-lg transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/60"
          >
            + Añadir Hito
          </button>
        </div>

        {milestones.length === 0 ? (
          <div className="text-center py-10">
            <Heart className="w-12 h-12 text-rose-300 dark:text-rose-700 mx-auto mb-2" />
            <p className="text-stone-600 dark:text-stone-300 font-medium text-sm">
              No tienes hitos marcados aún.
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Al guardar un recuerdo, activa "Marcar como Hito Principal" para que aparezca aquí.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-rose-200 dark:border-rose-900/60 ml-3 sm:ml-6 space-y-6 py-2">
            {milestones.map(moment => {
              const cat = CATEGORIES[moment.category] || CATEGORIES.otro
              const photo = moment.photos?.[0]
              const timeAgo = getTimeAgoSpanish(moment.date)

              return (
                <div key={moment.id} className="relative pl-6 sm:pl-8 group">
                  
                  {/* Pin Dot on timeline line */}
                  <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white dark:bg-stone-900 border-2 border-rose-500 group-hover:scale-125 transition-transform" />

                  {/* Milestone Card (sleek geometric rounded-xl) */}
                  <div
                    onClick={() => onSelectMoment(moment)}
                    className="bg-stone-50/70 dark:bg-stone-900/50 hover:bg-white dark:hover:bg-[#1e1c26] rounded-xl p-4 sm:p-5 border border-stone-200 dark:border-stone-800 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      {photo ? (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
                          <img
                            src={photo.url}
                            alt={moment.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-rose-100/60 dark:bg-rose-950/60 flex items-center justify-center text-2xl flex-shrink-0">
                          {moment.emoji}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cat.badgeBg} ${cat.darkBadgeBg}`}>
                            {cat.label}
                          </span>
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                            {formatDateSpanish(moment.date)}
                          </span>
                        </div>

                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base sm:text-lg group-hover:text-rose-500 transition-colors">
                          <button
                            type="button"
                            onClick={event => { event.stopPropagation(); onSelectMoment(moment) }}
                            className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-stone-900 rounded-sm cursor-pointer"
                          >
                            {moment.title}
                          </button>
                        </h4>

                        {moment.description && (
                          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-2 italic">
                            "{moment.description}"
                          </p>
                        )}

                        {moment.location && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 mt-2">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            <span>{moment.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-xs font-bold text-stone-400 dark:text-stone-500">
                        {timeAgo}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 group-hover:text-rose-500 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>

    </div>
  )
}
