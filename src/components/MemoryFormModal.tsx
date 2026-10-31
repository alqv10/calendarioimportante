import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { X, Upload, Trash2, MapPin, Sparkles, Heart, Image as ImageIcon, Calendar } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment, CategoryType, MemoryPhoto } from '../types'
import { triggerJoyfulConfetti } from '../services/confetti'

interface MemoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (moment: MemoryMoment) => void
  initialDate?: string
  initialData?: MemoryMoment | null
}

const FEELINGS = [
  { key: 'amor', label: 'Amor puro', emoji: '💖' },
  { key: 'magico', label: 'Mágico', emoji: '✨' },
  { key: 'feliz', label: 'Súper Feliz', emoji: '🥰' },
  { key: 'divertido', label: 'Divertido & Risas', emoji: '😂' },
  { key: 'emocionante', label: 'Emocionante', emoji: '🥳' },
  { key: 'nostalgico', label: 'Inolvidable', emoji: '🥹' },
]

export const MemoryFormModal: React.FC<MemoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialData
}) => {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState<CategoryType>('cita')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [feeling, setFeeling] = useState<any>('amor')
  const [isMilestone, setIsMilestone] = useState(false)
  const [photos, setPhotos] = useState<MemoryPhoto[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setDate(initialData.date)
      setCategory(initialData.category)
      setDescription(initialData.description)
      setLocation(initialData.location || '')
      setFeeling(initialData.feeling || 'amor')
      setIsMilestone(!!initialData.isMilestone)
      setPhotos(initialData.photos || [])
    } else {
      const defaultDate = initialDate || new Date().toISOString().split('T')[0]
      setDate(defaultDate)
      setTitle('')
      setCategory('cita')
      setDescription('')
      setLocation('')
      setFeeling('amor')
      setIsMilestone(false)
      setPhotos([])
    }
  }, [initialData, initialDate, isOpen])

  if (!isOpen) return null

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newPhotos: MemoryPhoto[] = []
    let processed = 0

    Array.from(files).forEach((file) => {
      // Basic image size safeguard: resize or read as base64 data URL
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          caption: ''
        })
        processed++
        if (processed === files.length) {
          setPhotos(prev => [...prev, ...newPhotos])
          setIsUploading(false)
        }
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) {
      alert('Por favor escribe un título y selecciona la fecha.')
      return
    }

    const selectedCategoryMeta = CATEGORIES[category]

    const moment: MemoryMoment = {
      id: initialData?.id || `moment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      date,
      category,
      emoji: selectedCategoryMeta.emoji,
      description: description.trim(),
      location: location.trim() || undefined,
      photos,
      feeling,
      isMilestone,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    onSave(moment)
    triggerJoyfulConfetti()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="text-xl sm:text-2xl font-bold font-sans">
                {initialData ? 'Editar Recuerdo' : 'Nuevo Momento Especial'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-rose-100 text-xs sm:text-sm mt-1">
            Guarda la fecha, las fotos, el lugar y lo que sintieron ese día
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                ¿Qué momento celebramos? *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Nuestra primera cita, Cena de aniversario..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-stone-900 text-sm placeholder:text-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                Fecha *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-stone-900 text-sm"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(CATEGORIES).map(cat => {
                const isSelected = category === cat.key
                return (
                  <button
                    type="button"
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                      isSelected
                        ? `${cat.badgeBg} border-rose-400 shadow-xs ring-1 ring-rose-300`
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feeling / Mood */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              ¿Cómo se sintió ese día?
            </label>
            <div className="flex flex-wrap gap-2">
              {FEELINGS.map(f => (
                <button
                  type="button"
                  key={f.key}
                  onClick={() => setFeeling(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                    feeling === f.key
                      ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>{f.emoji}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Lugar / Ubicación
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ej. Café La Estación, Parque Central, Granada..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-stone-900 text-sm placeholder:text-stone-400"
            />
          </div>

          {/* Description / Story */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Pequeña historia: ¿Qué pasó ese día?
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Cuéntanos un detalle bonito, lo que comieron, lo que te hizo reír, las palabras que dijeron..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-sans text-stone-800 text-sm placeholder:text-stone-400 resize-none"
            />
          </div>

          {/* Photos Upload */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                Fotos del recuerdo ({photos.length})
              </span>
              <span className="text-[11px] text-stone-400 font-normal">Puedes subir varias fotos</span>
            </label>

            {/* Photos Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-2.5">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                  <img src={photo.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-stone-200 hover:border-rose-400 bg-stone-50 hover:bg-rose-50/50 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5 text-stone-400 group-hover:text-rose-500 mb-1" />
                <span className="text-[11px] font-semibold text-stone-500">
                  {isUploading ? 'Cargando...' : '+ Subir foto'}
                </span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Milestone Checkbox */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Marcar como Hito Principal
                </h4>
                <p className="text-[11px] text-amber-700">
                  Aparecerá destacado con corona y en la sección de días juntos
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              id="isMilestone"
              checked={isMilestone}
              onChange={e => setIsMilestone(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Guardar Recuerdo</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
