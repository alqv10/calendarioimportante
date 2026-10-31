import { useState } from 'react'
import { X, Calendar, MapPin, Edit3, Trash2, Sparkles, ExternalLink, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment } from '../types'
import { formatDateSpanish, getTimeAgoSpanish } from '../utils/dateUtils'
import { triggerAnniversaryExplosion } from '../services/confetti'

interface MemoryDetailModalProps {
  moment: MemoryMoment | null
  onClose: () => void
  onEdit: (moment: MemoryMoment) => void
  onDelete: (id: string) => void
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({
  moment,
  onClose,
  onEdit,
  onDelete
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)

  if (!moment) return null

  const cat = CATEGORIES[moment.category] || CATEGORIES.otro
  const photos = moment.photos || []
  const hasPhotos = photos.length > 0
  const timeAgo = getTimeAgoSpanish(moment.date)

  const handleCelebrate = () => {
    triggerAnniversaryExplosion()
  }

  const handleDeleteConfirm = () => {
    if (window.confirm('¿Seguro que deseas eliminar este recuerdo?')) {
      onDelete(moment.id)
      onClose()
    }
  }

  const openGoogleMaps = () => {
    if (!moment.location) return
    const query = encodeURIComponent(moment.location)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#191720] rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8">
        
        {/* Photo Carousel or Top Graphic */}
        {hasPhotos ? (
          <div className="relative w-full h-72 sm:h-80 bg-stone-900">
            <img
              src={photos[activePhotoIdx].url}
              alt={moment.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-black/30" />

            {/* Prev / Next photo buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActivePhotoIdx((idx) => (idx === 0 ? photos.length - 1 : idx - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActivePhotoIdx((idx) => (idx === photos.length - 1 ? 0 : idx + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Photo indicator dots (geometric bars) */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      onClick={() => setActivePhotoIdx(i)}
                      className={`h-1.5 rounded-sm transition-all cursor-pointer ${
                        activePhotoIdx === i ? 'w-6 bg-rose-400' : 'w-2 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Close button on top */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title floating over photo */}
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${cat.badgeBg} ${cat.darkBadgeBg}`}>
                  {cat.emoji} {cat.label}
                </span>
                {moment.isMilestone && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400 text-stone-900">
                    ⭐ Hito importante
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">
                {moment.title}
              </h2>
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-white/20 text-white`}>
                {cat.emoji} {cat.label}
              </span>
              {moment.isMilestone && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400 text-stone-900">
                  ⭐ Hito
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {moment.title}
            </h2>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* Metadata Row: Date & Time Ago */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/40">
            <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 text-xs sm:text-sm font-semibold">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>{formatDateSpanish(moment.date)}</span>
            </div>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-stone-900 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 shadow-xs">
              ✨ {timeAgo}
            </span>
          </div>

          {/* Location with Google Maps link */}
          {moment.location && (
            <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span className="font-semibold text-stone-900 dark:text-stone-100">{moment.location}</span>
              </div>
              <button
                onClick={openGoogleMaps}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                <span>Ver en mapa</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Description / Story */}
          {moment.description ? (
            <div className="p-4 bg-stone-50/80 dark:bg-stone-900/40 rounded-xl border border-stone-200 dark:border-stone-800">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> Lo que pasó ese día
              </h4>
              <p className="text-stone-800 dark:text-stone-200 text-sm sm:text-base leading-relaxed font-sans whitespace-pre-line">
                {moment.description}
              </p>
            </div>
          ) : (
            <div className="text-stone-400 italic text-xs">
              Sin historia escrita para este recuerdo.
            </div>
          )}

          {/* Celebrate Button */}
          <div className="text-center pt-2">
            <button
              onClick={handleCelebrate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-stone-950 font-extrabold text-xs sm:text-sm shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>¡Celebrar este día inolvidable! 🎉</span>
            </button>
          </div>

          {/* Actions: Edit & Delete */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <button
              onClick={handleDeleteConfirm}
              className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar recuerdo</span>
            </button>

            <button
              onClick={() => {
                onEdit(moment)
                onClose()
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span>Editar</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
