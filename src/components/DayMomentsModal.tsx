import { X, Plus, Calendar, MapPin, Sparkles, Heart } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment } from '../types'
import { formatDateSpanish, getTimeAgoSpanish } from '../utils/dateUtils'

interface DayMomentsModalProps {
  isOpen: boolean
  onClose: () => void
  dateStr: string
  moments: MemoryMoment[]
  onSelectMoment: (moment: MemoryMoment) => void
  onAddNew: (dateStr: string) => void
}

export const DayMomentsModal: React.FC<DayMomentsModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  moments,
  onSelectMoment,
  onAddNew
}) => {
  if (!isOpen || !dateStr) return null

  const timeAgo = getTimeAgoSpanish(dateStr)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#191720] rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-sans">
                  {formatDateSpanish(dateStr)}
                </h3>
                <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-white/20 text-white">
                  ✨ {timeAgo}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {moments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-400 mb-2">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-stone-600 dark:text-stone-300 font-medium text-sm">
                No hay recuerdos registrados en este día aún.
              </p>
            </div>
          ) : (
            moments.map(moment => {
              const cat = CATEGORIES[moment.category] || CATEGORIES.otro
              const photo = moment.photos?.[0]

              return (
                <div
                  key={moment.id}
                  onClick={() => {
                    onSelectMoment(moment)
                    onClose()
                  }}
                  className="group bg-stone-50/70 dark:bg-stone-900/50 hover:bg-white dark:hover:bg-[#1e1c26] rounded-xl p-4 border border-stone-200 dark:border-stone-800 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    {photo ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
                        <img
                          src={photo.url}
                          alt={moment.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-2xl flex-shrink-0">
                        {moment.emoji}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cat.badgeBg} ${cat.darkBadgeBg}`}>
                          {cat.label}
                        </span>
                        {moment.isMilestone && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3 text-amber-600" /> Hito
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base truncate group-hover:text-rose-500 transition-colors">
                        {moment.title}
                      </h4>

                      {moment.location && (
                        <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 mt-1">
                          <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                          <span className="truncate">{moment.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {moment.description && (
                    <p className="mt-3 text-xs text-stone-600 dark:text-stone-300 italic font-serif line-clamp-2 bg-white/70 dark:bg-stone-800/60 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                      "{moment.description}"
                    </p>
                  )}
                </div>
              )
            })
          )}

          {/* Add Another Moment */}
          <button
            onClick={() => {
              onAddNew(dateStr)
              onClose()
            }}
            className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-800 hover:border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-50 text-rose-700 dark:text-rose-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Añadir recuerdo en esta fecha</span>
          </button>
        </div>

      </div>
    </div>
  )
}
