import { useState, useMemo } from 'react'
import { Search, Calendar, MapPin, ArrowUpDown, Plus } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment } from '../types'
import { formatDateSpanish, getTimeAgoSpanish } from '../utils/dateUtils'

interface TimelineViewProps {
  memories: MemoryMoment[]
  onSelectMoment: (moment: MemoryMoment) => void
  onNewMoment: () => void
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  memories,
  onSelectMoment,
  onNewMoment
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const filteredMemories = useMemo(() => {
    return memories
      .filter(m => {
        const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory
        const term = searchTerm.toLowerCase()
        const matchesSearch =
          !searchTerm ||
          m.title.toLowerCase().includes(term) ||
          m.description.toLowerCase().includes(term) ||
          (m.location && m.location.toLowerCase().includes(term))
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        return sortOrder === 'desc'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date)
      })
  }, [memories, selectedCategory, searchTerm, sortOrder])

  return (
    <div className="space-y-6">
      
      {/* Controls & Filter Bar */}
      <div className="bg-white/90 backdrop-blur rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar momentos, lugares, notas..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs sm:text-sm font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer self-end sm:self-auto"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-rose-500" />
            <span>{sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}</span>
          </button>

        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>💖 Todos ({memories.length})</span>
          </button>

          {Object.values(CATEGORIES).map(cat => {
            const count = memories.filter(m => m.category === cat.key).length
            if (count === 0 && selectedCategory !== cat.key) return null

            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.key
                    ? `${cat.color} text-white shadow-xs`
                    : `${cat.badgeBg} hover:opacity-80`
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                {count > 0 && <span className="opacity-75">({count})</span>}
              </button>
            )
          })}
        </div>

      </div>

      {/* Feed / Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-12 text-center border border-stone-200 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 flex items-center justify-center text-3xl mb-3">
            ✨
          </div>
          <h3 className="text-lg font-bold text-stone-800">
            No se encontraron recuerdos
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `No hay momentos que coincidan con "${searchTerm}". Prueba con otra palabra clave.`
              : 'Aún no has registrado momentos en esta categoría.'}
          </p>
          <button
            onClick={onNewMoment}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md hover:opacity-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear nuevo recuerdo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map(moment => {
            const cat = CATEGORIES[moment.category] || CATEGORIES.otro
            const firstPhoto = moment.photos?.[0]
            const timeAgo = getTimeAgoSpanish(moment.date)

            return (
              <div
                key={moment.id}
                onClick={() => onSelectMoment(moment)}
                className="group bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Photo Top Header or Polaroid Card */}
                {firstPhoto ? (
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <img
                      src={firstPhoto.url}
                      alt={moment.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md bg-white/90 text-stone-900`}>
                        {cat.emoji} {cat.label}
                      </span>
                      {moment.isMilestone && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-stone-900 shadow-xs">
                          ⭐ Hito
                        </span>
                      )}
                    </div>
                    {moment.photos.length > 1 && (
                      <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +{moment.photos.length} fotos
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-gradient-to-br from-rose-50 to-amber-50/50 border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cat.badgeBg}`}>
                        {cat.emoji} {cat.label}
                      </span>
                      <span className="text-3xl">{moment.emoji}</span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateSpanish(moment.date)}
                      </span>
                      <span className="text-[11px] font-medium text-stone-400">
                        {timeAgo}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-rose-600 transition-colors leading-snug">
                      {moment.title}
                    </h3>

                    {moment.description && (
                      <p className="mt-2.5 text-xs text-stone-600 line-clamp-3 leading-relaxed font-sans">
                        {moment.description}
                      </p>
                    )}
                  </div>

                  {moment.location && (
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs text-stone-500">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{moment.location}</span>
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
