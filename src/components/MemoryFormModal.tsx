import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { X, Upload, Trash2, MapPin, Sparkles, Heart, Image as ImageIcon, Calendar, Music, Link2, Volume2 } from 'lucide-react'
import { CATEGORIES } from '../types'
import type { MemoryMoment, CategoryType, MemoryPhoto } from '../types'

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
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)

  // Music state
  const [songTitle, setSongTitle] = useState('')
  const [songArtist, setSongArtist] = useState('')
  const [songUrl, setSongUrl] = useState('')
  const [audioData, setAudioData] = useState<string | undefined>()
  const [audioFileName, setAudioFileName] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

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
      setSongTitle(initialData.songTitle || '')
      setSongArtist(initialData.songArtist || '')
      setSongUrl(initialData.songUrl || '')
      setAudioData(initialData.audioData)
      setAudioFileName(initialData.audioData ? 'Archivo de audio guardado' : '')
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
      setSongTitle('')
      setSongArtist('')
      setSongUrl('')
      setAudioData(undefined)
      setAudioFileName('')
    }
  }, [initialData, initialDate, isOpen])

  if (!isOpen) return null

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingPhotos(true)
    const newPhotos: MemoryPhoto[] = []
    let processed = 0

    Array.from(files).forEach((file) => {
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
          setIsUploadingPhotos(false)
        }
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAudioFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setAudioData(base64)
      if (!songTitle) {
        // Auto-fill song title from file name
        const cleanName = file.name.replace(/\.[^/.]+$/, '')
        setSongTitle(cleanName)
      }
    }
    reader.readAsDataURL(file)
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
      songTitle: songTitle.trim() || undefined,
      songArtist: songArtist.trim() || undefined,
      songUrl: songUrl.trim() || undefined,
      audioData: audioData || undefined,
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    onSave(moment)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#191720] rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-4 sm:my-8">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 p-5 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="text-xl sm:text-2xl font-bold font-sans">
                {initialData ? 'Editar Recuerdo' : 'Nuevo Momento Especial'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-rose-100 text-xs sm:text-sm mt-1">
            Guarda fecha, fotos, música, lugar y lo que sintieron ese día
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                ¿Qué momento celebramos? *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Nuestra primera cita, Cena especial..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                Fecha *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-sm"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
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
                        ? `${cat.badgeBg} ${cat.darkBadgeBg} border-rose-400 dark:border-rose-600 shadow-xs ring-1 ring-rose-300 dark:ring-rose-800`
                        : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
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
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              ¿Cómo se sintió ese día?
            </label>
            <div className="flex flex-wrap gap-2">
              {FEELINGS.map(f => (
                <button
                  type="button"
                  key={f.key}
                  onClick={() => setFeeling(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                    feeling === f.key
                      ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
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
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Lugar / Ubicación
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ej. Café La Estación, Mirador, Restaurante..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-sm"
            />
          </div>

          {/* Music / Audio Section */}
          <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-rose-500" />
                <span>Música o Canción de ese momento</span>
              </label>
              <span className="text-[11px] text-stone-400">Opcional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={songTitle}
                onChange={e => setSongTitle(e.target.value)}
                placeholder="Nombre de la canción (ej. Perfect)"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <input
                type="text"
                value={songArtist}
                onChange={e => setSongArtist(e.target.value)}
                placeholder="Artista (ej. Ed Sheeran)"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Link2 className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={songUrl}
                  onChange={e => setSongUrl(e.target.value)}
                  placeholder="Enlace de Spotify, YouTube o web"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Upload audio file button */}
              <div className="w-full sm:w-auto flex items-center gap-1">
                <input
                  type="file"
                  ref={audioInputRef}
                  onChange={handleAudioUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{audioFileName ? 'Cambiar audio' : 'Subir audio/voz'}</span>
                </button>
                {audioData && (
                  <button
                    type="button"
                    onClick={() => { setAudioData(undefined); setAudioFileName('') }}
                    title="Eliminar archivo de audio"
                    className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {audioFileName && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                🎵 Audio cargado: {audioFileName}
              </p>
            )}
          </div>

          {/* Description / Story */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Pequeña historia: ¿Qué pasó ese día?
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Cuéntanos un detalle bonito, lo que comieron, lo que te hizo reír, las palabras que dijeron..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 font-sans text-sm resize-none"
            />
          </div>

          {/* Photos Upload */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                Fotos del recuerdo ({photos.length})
              </span>
              <span className="text-[11px] text-stone-400 font-normal">Puedes subir varias fotos</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
                  <img src={photo.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-rose-400 dark:hover:border-rose-500 bg-stone-50 dark:bg-stone-900 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5 text-stone-400 group-hover:text-rose-500 mb-1" />
                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                  {isUploadingPhotos ? 'Cargando...' : '+ Subir foto'}
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
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Marcar como Hito Principal
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Aparecerá destacado en la sección de hitos y días de amor
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
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-semibold text-xs sm:text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
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
