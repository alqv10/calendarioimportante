import { Sparkles, Heart, Award, MapPin, ChevronRight, PartyPopper } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment } from '../types'
import { getDaysTogether, formatDateSpanish, getTimeAgoSpanish } from '../utils/dateUtils'
import { triggerAnniversaryExplosion } from '../services/confetti'

interface MilestonesViewProps {
  memories: MemoryMoment[]
  onSelectMoment: (moment: MemoryMoment) => void
  onNewMoment: () => void
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  memories,
  onSelectMoment,
  onNewMoment
}) => {
  // Find earliest milestone or moment
  const sortedByDateAsc = [...memories].sort((a, b) => a.date.localeCompare(b.date))
  const firstMoment = sortedByDateAsc[0]

  // Milestones filter
  const milestones = memories.filter(
    m => m.isMilestone || m.category === 'aniversario' || m.category === 'cita'
  ).sort((a, b) => a.date.localeCompare(b.date))

  const daysTogether = firstMoment ? getDaysTogether(firstMoment.date) : 0

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Hero Banner: Total Days & Happiness Counter */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 text-white p-8 sm:p-10 shadow-xl shadow-rose-500/20">
        
        {/* Decorative background shapes */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-48 h-48 rounded-full bg-amber-300/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Nuestra Historia de Momentos
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {daysTogether > 0 ? (
                <>
                  <span className="text-amber-200 font-black">{daysTogether}</span> días de recuerdos
                </>
              ) : (
                'Comenzando nuestra historia'
              )}
            </h2>

            <p className="text-rose-100 text-sm mt-2 max-w-md">
              {firstMoment ? (
                <>Desde el primer momento el <strong>{formatDateSpanish(firstMoment.date)}</strong> ("{firstMoment.title}").</>
              ) : (
                'Añade tu primera cita o momento especial para iniciar el contador.'
              )}
            </p>
          </div>

          <button
            onClick={() => triggerAnniversaryExplosion()}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 font-extrabold text-sm shadow-lg shadow-black/10 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <PartyPopper className="w-5 h-5 text-amber-500" />
            <span>¡Celebrar con Confeti!</span>
          </button>
        </div>
      </div>

      {/* Milestones Roadmap */}
      <div className="bg-white/90 backdrop-blur rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              Hitos Inolvidables
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Los momentos que marcaron un antes y un después
            </p>
          </div>

          <button
            onClick={onNewMoment}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            + Añadir Hito
          </button>
        </div>

        {milestones.length === 0 ? (
          <div className="text-center py-10">
            <Heart className="w-12 h-12 text-rose-300 mx-auto mb-2" />
            <p className="text-stone-600 font-medium text-sm">
              No tienes hitos marcados aún.
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Al guardar un recuerdo, activa "Marcar como Hito Principal" para que aparezca aquí.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-rose-200 ml-4 sm:ml-8 space-y-8 py-2">
            {milestones.map(moment => {
              const cat = CATEGORIES[moment.category] || CATEGORIES.otro
              const photo = moment.photos?.[0]
              const timeAgo = getTimeAgoSpanish(moment.date)

              return (
                <div key={moment.id} className="relative pl-6 sm:pl-8 group">
                  
                  {/* Pin Dot on timeline line */}
                  <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-white border-4 border-rose-500 shadow-sm group-hover:scale-125 transition-transform" />

                  {/* Milestone Card */}
                  <div
                    onClick={() => onSelectMoment(moment)}
                    className="bg-stone-50/70 hover:bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {photo ? (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-stone-200">
                          <img
                            src={photo.url}
                            alt={moment.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-rose-100/60 flex items-center justify-center text-2xl flex-shrink-0">
                          {moment.emoji}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.badgeBg}`}>
                            {cat.label}
                          </span>
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            {formatDateSpanish(moment.date)}
                          </span>
                        </div>

                        <h4 className="font-bold text-stone-900 text-base sm:text-lg group-hover:text-rose-600 transition-colors">
                          {moment.title}
                        </h4>

                        {moment.description && (
                          <p className="text-xs text-stone-600 mt-1 line-clamp-2 italic">
                            "{moment.description}"
                          </p>
                        )}

                        {moment.location && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-2">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            <span>{moment.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-xs font-bold text-stone-400">
                        {timeAgo}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:text-rose-600 group-hover:bg-rose-50 transition-colors">
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
